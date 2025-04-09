import { NextResponse } from 'next/server';
// @ts-ignore
import twilio from 'twilio';
import https from 'https';
import { getRandomApiKey } from '@/lib/apiKeyManager';

// Twilio configuration
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    throw new Error('Missing required Twilio environment variables');
}

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Ultravox configuration
// We'll get the API key dynamically from our random rotation system
const SYSTEM_PROMPT = `
  # Drive-Thru Order System Configuration

  ## Agent Role
  - Name: Dr. Donut Drive-Thru Assistant
  - Context: Voice-based order taking system with TTS output
  - Current time: ${new Date()}

  ## Menu Items
    # DONUTS
    PUMPKIN SPICE ICED DOUGHNUT $1.29
    PUMPKIN SPICE CAKE DOUGHNUT $1.29
    OLD FASHIONED DOUGHNUT $1.29
    CHOCOLATE ICED DOUGHNUT $1.09
    CHOCOLATE ICED DOUGHNUT WITH SPRINKLES $1.09
    RASPBERRY FILLED DOUGHNUT $1.09
    BLUEBERRY CAKE DOUGHNUT $1.09
    STRAWBERRY ICED DOUGHNUT WITH SPRINKLES $1.09
    LEMON FILLED DOUGHNUT $1.09
    DOUGHNUT HOLES $3.99

    # COFFEE & DRINKS
    PUMPKIN SPICE COFFEE $2.59
    PUMPKIN SPICE LATTE $4.59
    REGULAR BREWED COFFEE $1.79
    DECAF BREWED COFFEE $1.79
    LATTE $3.49
    CAPPUCINO $3.49
    CARAMEL MACCHIATO $3.49
    MOCHA LATTE $3.49
    CARAMEL MOCHA LATTE $3.49

  ## Conversation Flow
  1. Greeting -> Order Taking -> Order Confirmation -> Payment Direction

  ## Response Guidelines
  1. Voice-Optimized Format
    - Use spoken numbers ("one twenty-nine" vs "$1.29")
    - Avoid special characters and formatting
    - Use natural speech patterns

  2. Conversation Management
    - Keep responses brief (1-2 sentences)
    - Use clarifying questions for ambiguity
    - Maintain conversation flow without explicit endings
    - Allow for casual conversation

  3. Order Processing
    - Validate items against menu
    - Suggest similar items for unavailable requests
    - Cross-sell based on order composition:
      - Donuts -> Suggest drinks
      - Drinks -> Suggest donuts
      - Both -> No additional suggestions

  4. Standard Responses
    - Off-topic: "Um... this is a Dr. Donut."
    - Thanks: "My pleasure."
    - Menu inquiries: Provide 2-3 relevant suggestions

  5. Order confirmation
    - Only confirm the full order at the end when the customer is done

  ## Error Handling
  1. Menu Mismatches
    - Suggest closest available item
    - Explain unavailability briefly
  2. Unclear Input
    - Request clarification
    - Offer specific options

  ## State Management
  - Track order contents
  - Monitor order type distribution (drinks vs donuts)
  - Maintain conversation context
  - Remember previous clarifications    

  DOT REPLY AT ALL IF YOU DID NOT CATCH OR HEAR ANYTHING THEY SAID, DO NOT EVEN ASK THEM WHAT THEY SAID, ONLY REPLY WHEN YOU HEAR SOMETHING YOU CAN ANSWER.
  `;

const ULTRAVOX_CALL_CONFIG = {
    systemPrompt: SYSTEM_PROMPT,
    model: 'fixie-ai/ultravox',
    voice: 'Mark',
    temperature: 0.3,
    firstSpeaker: 'FIRST_SPEAKER_USER',
    medium: { "twilio": {} }
};

const ULTRAVOX_API_URL = 'https://api.ultravox.ai/api/calls';

// Define the expected response type from Ultravox
interface UltravoxResponse {
    joinUrl: string;
    [key: string]: any;
}

async function createUltravoxCall(): Promise<UltravoxResponse> {
    return new Promise((resolve, reject) => {
        // Get a random API key from our rotation system
        const apiKey = getRandomApiKey();
        
        const request = https.request(ULTRAVOX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            }
        });

        let data = '';

        request.on('response', (response) => {
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    console.log('Ultravox API response:', parsedData);
                    resolve(parsedData);
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${(error as Error).message}`));
                }
            });
        });

        request.on('error', (error) => {
            console.error('Ultravox API request error:', error);
            reject(error);
        });
        
        request.write(JSON.stringify(ULTRAVOX_CALL_CONFIG));
        request.end();
    });
}

export async function POST(request: Request) {
    try {
        // Parse the request body to get the phone number
        const body = await request.json();
        const phoneNumber = body.phoneNumber;

        if (!phoneNumber) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        console.log('Creating Ultravox call...');
        const ultravoxResponse = await createUltravoxCall();
        console.log('Full Ultravox response:', ultravoxResponse);
        
        if (!ultravoxResponse || !ultravoxResponse.joinUrl) {
            console.error('Invalid response from Ultravox:', ultravoxResponse);
            return NextResponse.json(
                { error: 'Failed to get join URL from Ultravox', response: ultravoxResponse },
                { status: 500 }
            );
        }

        // Initialize Twilio client
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        
        // Make the call
        const call = await client.calls.create({
            twiml: `<Response><Connect><Stream url="${ultravoxResponse.joinUrl}"/></Connect></Response>`,
            to: phoneNumber,
            from: TWILIO_PHONE_NUMBER
        });

        return NextResponse.json({
            success: true,
            callSid: call.sid,
            message: 'Call initiated successfully'
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'An error occurred' },
            { status: 500 }
        );
    }
}

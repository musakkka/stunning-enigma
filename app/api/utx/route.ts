import { NextResponse, NextRequest } from 'next/server';
import { CallConfig, SelectedTool } from '@/lib/types';
import { getNextApiKeyInfo } from '@/lib/apiKeyManager';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://genie.elyxa.dev',
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002'
  ];
  
  const corsOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://genie.elyxa.dev',
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002'
  ];
  
  const corsOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];
  
  const headers = new Headers({
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  });

  try {
    const body: CallConfig = await request.json();
    console.log('Attempting to call Ultravox API...');
    
    // Get the next API key and its env var name
    const { apiKey, keyName } = getNextApiKeyInfo();

    // Map API key index to corpus ID (env override supported)
    const keyIndexMatch = keyName.match(/ULTRAVOX_API_KEY_(\d+)/);
    const keyIndex = keyIndexMatch ? keyIndexMatch[1] : undefined;

    const defaultCorpusMap: Record<string, string> = {
      '1': '79d9879b-c52a-4842-b717-1261058a6a89',
      '2': '9a6a4d53-458f-401d-9f85-534f8c5f5efa',
      '3': 'e8f3884b-7b58-4fd4-8a46-f49d140e7fc3',
      '4': 'b836266d-9c04-4ecc-b57d-290126715eee',
      '5': 'cca23fbd-7216-47cf-8d76-d271fcac19a0'
    };

    const envCorpusId = keyIndex ? process.env[`ULTRAVOX_CORPUS_ID_${keyIndex}`] : undefined;
    const mappedCorpusId = envCorpusId || (keyIndex ? defaultCorpusMap[keyIndex] : undefined);

    // Ensure selectedTools contains queryCorpus with the mapped corpus_id
    const updatedBody: CallConfig = { ...body };
    if (mappedCorpusId) {
      const tools: SelectedTool[] = updatedBody.selectedTools ? [...updatedBody.selectedTools] : [];
      const existingIndex = tools.findIndex(t => t.toolName === 'queryCorpus');
      if (existingIndex >= 0) {
        tools[existingIndex] = {
          ...tools[existingIndex],
          toolName: 'queryCorpus',
          parameterOverrides: {
            ...(tools[existingIndex].parameterOverrides || {}),
            corpus_id: mappedCorpusId,
          },
        };
      } else {
        tools.push({
          toolName: 'queryCorpus',
          parameterOverrides: { corpus_id: mappedCorpusId },
        });
      }
      updatedBody.selectedTools = tools;
    }
    
    const response = await fetch('https://api.ultravox.ai/api/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ ...updatedBody }),
    });

    console.log('Ultravox API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ultravox API error:', errorText);
      throw new Error(`Ultravox API error: ${response.status}, ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('Error in API route:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error calling Ultravox API', details: error.message },
        { status: 500, headers }
      );
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred.' },
        { status: 500, headers }
      );
    }
  }
}
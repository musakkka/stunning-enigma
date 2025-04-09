# stunning-enigma

A Next.js application for voice-based order taking system with TTS output.

# Ultravox API Tutorial:  Building Interactive UI with Client Tools
This repo serves as the starting point for the [tutorial](https://docs.ultravox.ai/guides/clienttoolstutorial) from the Ultravox documentation.

## Set-up
1. Add an Ultravox API key
  * Create a file called `.env.local`
  * In `.env.local` add your key like this: `ULTRAVOX_API_KEY=<YOUR_KEY_HERE>`

## Running
1. This repo uses `pnpm`. Installation instructions [here](https://pnpm.io/installation).
1. Install all depedencies with `pnpm install`.
1. Run the app with `pnpm dev`.


## Query Params
| What | Parameter | Notes |
|--------|--------|---------|
|**Debug Logging**|`showDebugMessages=true`| Turns on some additional console logging.|
|**Speaker Mute Toggle**|`showSpeakerMute=true`| Shows the speaker mute button.|
|**Change Model**|`model=ultravox-70B`|Changes the model to what is specified. Note: the app will prepend `fixie-ai/` to the value.|
|**Enable User Transcripts**|`showUserTranscripts=true`|Displays user transcripts. Otherwise, only Ultravox/agent transcripts are shown.|

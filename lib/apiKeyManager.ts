import fs from 'fs';
import path from 'path';

// Function to get a random API key from environment variables
export function getRandomApiKey(): string {
  // Get all environment variables that start with ULTRAVOX_API_KEY
  const envKeys = Object.keys(process.env).filter(key => 
    key.startsWith('ULTRAVOX_API_KEY_')
  );
  
  if (envKeys.length === 0) {
    console.error('No Ultravox API keys found in environment variables');
    throw new Error('No Ultravox API keys configured');
  }
  
  // Select a random key
  const randomIndex = Math.floor(Math.random() * envKeys.length);
  const selectedKey = process.env[envKeys[randomIndex]];
  
  if (!selectedKey) {
    console.error('Selected API key is undefined');
    throw new Error('API key is undefined');
  }
  
  return selectedKey;
}

// Function to get the current API key (for compatibility)
export function getCurrentApiKey(): string {
  return getRandomApiKey();
}

// Function to get the next API key (for compatibility)
export function getNextApiKey(): string {
  return getRandomApiKey();
} 

// Returns both the selected API key value and the env var name used (e.g., ULTRAVOX_API_KEY_1)
export function getNextApiKeyInfo(): { apiKey: string; keyName: string } {
  const envKeys = Object.keys(process.env).filter(key => 
    key.startsWith('ULTRAVOX_API_KEY_')
  );

  if (envKeys.length === 0) {
    console.error('No Ultravox API keys found in environment variables');
    throw new Error('No Ultravox API keys configured');
  }

  const randomIndex = Math.floor(Math.random() * envKeys.length);
  const keyName = envKeys[randomIndex];
  const apiKey = process.env[keyName];

  if (!apiKey) {
    console.error('Selected API key is undefined');
    throw new Error('API key is undefined');
  }

  return { apiKey, keyName };
}
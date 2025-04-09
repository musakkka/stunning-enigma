'use client';

import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'; 
import { startCall, endCall } from '@/lib/callFunctions'
import { CallConfig, SelectedTool } from '@/lib/types'
import demoConfig from '@/app/demo-config';
import { Role, Transcript, UltravoxExperimentalMessageEvent, UltravoxSessionStatus } from 'ultravox-client';
import BorderedImage from '@/components/BorderedImage';
import UVLogo from '@/public/UVMark-White.svg';
import CallStatus from '@/components/CallStatus';
import DebugMessages from '@/components/DebugMessages';
import MicToggleButton from '@/components/MicToggleButton';
import { PhoneOffIcon } from 'lucide-react';

type SearchParamsProps = {
  showMuteSpeakerButton: boolean;
  modelOverride: string | undefined;
  showDebugMessages: boolean;
  showUserTranscripts: boolean;
};

type SearchParamsHandlerProps = {
  children: (props: SearchParamsProps) => React.ReactNode;
};

function SearchParamsHandler({ children }: SearchParamsHandlerProps) {
  // Process query params to see if we want to change the behavior for showing speaker mute button or changing the model
  const searchParams = useSearchParams();
  const showMuteSpeakerButton = searchParams.get('showSpeakerMute') === 'true';
  const showDebugMessages = searchParams.get('showDebugMessages') === 'true';
  const showUserTranscripts = searchParams.get('showUserTranscripts') === 'true';
  let modelOverride: string | undefined;
  
  if (searchParams.get('model')) {
    modelOverride = "fixie-ai/" + searchParams.get('model');
  }

  return children({ showMuteSpeakerButton, modelOverride, showDebugMessages, showUserTranscripts });
}

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>('off');
  const [callTranscript, setCallTranscript] = useState<Transcript[] | null>([]);
  const [callDebugMessages, setCallDebugMessages] = useState<UltravoxExperimentalMessageEvent[]>([]);
  const [customerProfileKey, setCustomerProfileKey] = useState<string | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  useEffect(() => {
    if (transcriptContainerRef.current) {
      // Ensure we're always scrolled to the bottom
      transcriptContainerRef.current.scrollTo({
        top: transcriptContainerRef.current.scrollHeight,
        behavior: 'auto'
      });
    }
  }, [callTranscript]);

  const handleStatusChange = useCallback((status: UltravoxSessionStatus | string | undefined) => {
    if(status) {
      setAgentStatus(status);
      setIsConnecting(status === 'Starting call...' || status.includes('connecting'));
    } else {
      setAgentStatus('off');
      setIsConnecting(false);
    }
  }, []);

  const handleTranscriptChange = useCallback((transcripts: Transcript[] | undefined) => {
    if(transcripts) {
      setCallTranscript([...transcripts]);
    }
  }, []);

  const handleDebugMessage = useCallback((debugMessage: UltravoxExperimentalMessageEvent) => {
    setCallDebugMessages(prevMessages => [...prevMessages, debugMessage]);
  }, []);

  const clearCustomerProfile = useCallback(() => {
    // This will trigger a re-render of CustomerProfileForm with a new empty profile
    setCustomerProfileKey(prev => prev ? `${prev}-cleared` : 'cleared');
  }, []);

  const handleStartCallButtonClick = async (modelOverride?: string, showDebugMessages?: boolean) => {
    try {
      setIsConnecting(true);
      handleStatusChange('Starting call...');
      setCallTranscript(null);
      setCallDebugMessages([]);
      clearCustomerProfile();

      // Generate a new key for the customer profile
      const newKey = `call-${Date.now()}`;
      setCustomerProfileKey(newKey);

      // Setup our call config including the call key as a parameter restriction
      let callConfig: CallConfig = {
        systemPrompt: demoConfig.callConfig.systemPrompt,
        model: modelOverride || demoConfig.callConfig.model,
        languageHint: demoConfig.callConfig.languageHint,
        voice: demoConfig.callConfig.voice,
        temperature: demoConfig.callConfig.temperature,
        maxDuration: demoConfig.callConfig.maxDuration,
        timeExceededMessage: demoConfig.callConfig.timeExceededMessage
      };

      const paramOverride: { [key: string]: any } = {
        "callId": newKey
      }

      let cpTool: SelectedTool | undefined = demoConfig?.callConfig?.selectedTools?.find(tool => tool.toolName === "createProfile");
      
      if (cpTool) {
        cpTool.parameterOverrides = paramOverride;
      }
      callConfig.selectedTools = demoConfig.callConfig.selectedTools;

      await startCall({
        onStatusChange: handleStatusChange,
        onTranscriptChange: handleTranscriptChange,
        onDebugMessage: handleDebugMessage
      }, callConfig, showDebugMessages);

      setIsCallActive(true);
      handleStatusChange('Call started successfully');
    } catch (error) {
      setIsConnecting(false);
      handleStatusChange(`Error starting call: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleEndCallButtonClick = async () => {
    try {
      handleStatusChange('Ending call...');
      await endCall();
      setIsCallActive(false);

      clearCustomerProfile();
      setCustomerProfileKey(null);
      handleStatusChange('Call ended successfully');
    } catch (error) {
      handleStatusChange(`Error ending call: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen">Loading...</div>}>
      <SearchParamsHandler>
        {({ showMuteSpeakerButton, modelOverride, showDebugMessages, showUserTranscripts }: SearchParamsProps) => (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="max-w-md mx-auto w-full p-5 ">
              {/* Status Indicator - Green when active, Orange and blinking when connecting, Gray when inactive */}
              <div className="flex items-center justify-center mb-6">
                <div 
                  className={`w-4 h-4 rounded-full ${
                    isCallActive ? 'bg-green-500' : 
                    isConnecting ? 'bg-orange-500 animate-pulse' : 'bg-gray-500'
                  }`} 
                  title={agentStatus}
                />
                <span className="ml-2 text-sm text-gray-400">({agentStatus})</span>
              </div>
              
              <div className="flex flex-col items-center space-y-6">
                {/* Transcript Container */}
                {isCallActive && (
                  <div className="relative h-[300px] w-full overflow-hidden rounded-lg bg-gray-900 bg-opacity-20">
                    <div 
                      ref={transcriptContainerRef}
                      className="h-full w-full p-4 overflow-y-auto scrollbar-hidden flex flex-col justify-end"
                    >
                      <div className="space-y-3">
                        {callTranscript && callTranscript.map((transcript, index) => (
                          <div 
                            key={index} 
                            className={transcript.speaker === 'agent' ? "animate-autoScroll" : ""}
                          >
                            {transcript.speaker === 'agent' && (
                              <p className="mb-2 text-white">{transcript.text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Top fade mask for blur effect */}
                    <div className="transcript-fade-top"></div>
                  </div>
                )}
                
                {/* Controls */}
                {isCallActive ? (
                  <div className="flex justify-center w-full gap-4">
                    <div className="w-1/2">
                      <div className="w-full px-6 py-3 bg-blue-600 rounded-full flex items-center justify-center">
                        <MicToggleButton role={Role.USER} />
                      </div>
                    </div>
                    <div className="w-1/2">
                      <button
                        type="button"                      className="w-full px-6 py-3 bg-red-500 rounded-full flex items-center justify-center"
                        onClick={handleEndCallButtonClick}
                      >
                        <PhoneOffIcon width={20} className="brightness-0 invert mr-2" />
                        End Call
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      className="px-10 py-3 border-2 rounded-full"
                      onClick={() => handleStartCallButtonClick(modelOverride, showDebugMessages)}
                    >
                      Start Call
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SearchParamsHandler>
    </Suspense>
  );
}
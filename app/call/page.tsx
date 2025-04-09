'use client';

import React, { useState } from 'react';
import { PhoneIcon, Bot, ArrowRight } from 'lucide-react';

export default function CallPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState<{
    loading: boolean;
    success?: boolean;
    callSid?: string;
    error?: string;
  }>({ loading: false });

  const handleCall = async () => {
    if (!phoneNumber) {
      setCallStatus({
        loading: false,
        success: false,
        error: 'Please enter a phone number'
      });
      return;
    }

    try {
      setCallStatus({ loading: true });
      
      const response = await fetch('/api/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCallStatus({
          loading: false,
          success: true,
          callSid: data.callSid
        });
      } else {
        setCallStatus({
          loading: false,
          success: false,
          error: data.error || 'Failed to initiate call'
        });
      }
    } catch (error) {
      setCallStatus({
        loading: false,
        success: false,
        error: 'An error occurred while making the call'
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5">
      <div className="max-w-md w-full bg-gray-900 bg-opacity-20 p-8 rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6">AI Phone Call</h1>
        
        <div className="flex items-center justify-center mb-6">
          <div 
            className={`w-4 h-4 rounded-full ${
              callStatus.success ? 'bg-green-500' : 
              callStatus.loading ? 'bg-orange-500 animate-pulse' : 'bg-gray-500'
            }`} 
          />
          <span className="ml-2 text-sm text-gray-400">
            {callStatus.success ? 'Call in progress' : 
             callStatus.loading ? 'Connecting...' : 'Ready to call'}
          </span>
        </div>
        
        {!callStatus.success ? (
          <>
            <div className="mb-6">
              <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Enter phone number with country code</p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={handleCall}
                disabled={callStatus.loading}
                className={`px-6 py-3 rounded-full flex items-center justify-center ${
                  callStatus.loading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <PhoneIcon className="mr-2 h-5 w-5" />
                {callStatus.loading ? 'Connecting...' : 'Call Now'}
              </button>
            </div>
          </>
        ) : (
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-2">
                  <Bot size={24} />
                </div>
                <span className="text-sm">AI Assistant</span>
              </div>
              
              <div className="flex-1 px-4 relative">
                <div className="h-0.5 bg-gradient-to-r from-blue-600 to-green-500 w-full"></div>
                {/* Animated dots */}
                <div className="flex justify-between absolute top-0 left-0 right-0 transform -translate-y-1/2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="h-2 w-2 rounded-full bg-blue-500"
                      style={{
                        animation: `flowAnimation 1.5s infinite ${i * 0.3}s`,
                        opacity: 0
                      }}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mb-2">
                  <PhoneIcon size={20} />
                </div>
                <span className="text-sm">{phoneNumber}</span>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-lg">Your AI assistant is speaking with this number</p>
              <button
                onClick={() => setCallStatus({ loading: false })}
                className="mt-4 px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 text-sm"
              >
                End Call & Start New
              </button>
            </div>
          </div>
        )}
        
        {callStatus.error && (
          <div className="mt-4 p-3 bg-red-900 bg-opacity-30 border border-red-800 rounded-md text-red-300">
            {callStatus.error}
          </div>
        )}
      </div>
      
      {/* CSS for the animation */}
      <style jsx>{`
        @keyframes flowAnimation {
          0% { opacity: 0; transform: translateX(0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateX(20px); }
        }
      `}</style>
    </div>
  );
} 
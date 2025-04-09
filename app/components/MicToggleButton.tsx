import React, { useState, useCallback } from 'react';
import { Role } from 'ultravox-client';
import { toggleMute } from '@/lib/callFunctions';
import { MicIcon, MicOffIcon, Volume2Icon, VolumeOffIcon } from 'lucide-react';

interface MicToggleButtonProps {
  role: Role;
  className?: string;
}

const MicToggleButton: React.FC<MicToggleButtonProps> = ({ role, className = '' }) => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMic = useCallback(async () => {
    try {
      toggleMute(role);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  }, [isMuted, role]);

  return (
    <button
      onClick={toggleMic}
      className={`flex items-center justify-center ${className}`}
    >
      {isMuted ? (
        <>
          { role === Role.USER ? (
            <MicOffIcon width={20} className="brightness-0 invert mr-2" />
          ) : (
            <VolumeOffIcon width={20} className="brightness-0 invert mr-2" />
          )}
          Unmute
        </>
      ) : (
        <>
          { role === Role.USER ? (
            <MicIcon width={20} className="brightness-0 invert mr-2" />
          ) : (
            <Volume2Icon width={20} className="brightness-0 invert mr-2" />
          )}
          Mute
        </>
      )}
    </button>
  );
};

export default MicToggleButton;
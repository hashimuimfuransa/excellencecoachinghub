import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VideoState {
  playing: boolean;
  muted: boolean;
  error?: string | null;
}

interface GlobalVideoContextType {
  videoStates: Record<string, VideoState>;
  currentPlayingVideo: string | null;
  updateVideoState: (videoId: string, state: Partial<VideoState>) => void;
  setCurrentPlayingVideo: (videoId: string | null) => void;
  muteAllVideos: () => void;
  pauseAllVideos: () => void;
  pauseAllExcept: (videoId: string) => void;
  autoPlayVideo: (videoId: string) => void;
}

const GlobalVideoContext = createContext<GlobalVideoContextType | undefined>(undefined);

export const useGlobalVideo = () => {
  const context = useContext(GlobalVideoContext);
  if (!context) {
    throw new Error('useGlobalVideo must be used within a GlobalVideoProvider');
  }
  return context;
};

interface GlobalVideoProviderProps {
  children: ReactNode;
}

export const GlobalVideoProvider: React.FC<GlobalVideoProviderProps> = ({ children }) => {
  const [videoStates, setVideoStates] = useState<Record<string, VideoState>>({});
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);

  const updateVideoState = (videoId: string, state: Partial<VideoState>) => {
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], ...state }
    }));

    // If this video is now playing, pause all other videos
    if (state.playing === true) {
      pauseAllExcept(videoId);
      setCurrentPlayingVideo(videoId);
    } else if (state.playing === false && currentPlayingVideo === videoId) {
      setCurrentPlayingVideo(null);
    }
  };

  const pauseAllVideos = () => {
    // Find all video elements and pause them
    const allVideos = document.querySelectorAll('video[data-video-id]') as NodeListOf<HTMLVideoElement>;
    allVideos.forEach(video => {
      if (!video.paused) {
        video.pause();
        const videoId = video.getAttribute('data-video-id');
        if (videoId) {
          setVideoStates(prev => ({
            ...prev,
            [videoId]: { ...prev[videoId], playing: false }
          }));
        }
      }
    });
    setCurrentPlayingVideo(null);
  };

  const pauseAllExcept = (exceptVideoId: string) => {
    // Find all video elements except the specified one and pause them
    const allVideos = document.querySelectorAll('video[data-video-id]') as NodeListOf<HTMLVideoElement>;
    allVideos.forEach(video => {
      const videoId = video.getAttribute('data-video-id');
      if (videoId && videoId !== exceptVideoId && !video.paused) {
        video.pause();
        setVideoStates(prev => ({
          ...prev,
          [videoId]: { ...prev[videoId], playing: false }
        }));
      }
    });
  };

  const muteAllVideos = () => {
    const allVideos = document.querySelectorAll('video[data-video-id]') as NodeListOf<HTMLVideoElement>;
    allVideos.forEach(video => {
      video.muted = true;
      const videoId = video.getAttribute('data-video-id');
      if (videoId) {
        setVideoStates(prev => ({
          ...prev,
          [videoId]: { ...prev[videoId], muted: true }
        }));
      }
    });
  };

  const autoPlayVideo = (videoId: string) => {
    // First pause all other videos
    pauseAllExcept(videoId);
    
    // Find the target video element
    const videoElement = document.querySelector(`video[data-video-id="${videoId}"]`) as HTMLVideoElement;
    if (!videoElement) {
      console.error(`Video element with id ${videoId} not found`);
      return;
    }

    // Automatically unmute the video when it starts playing
    videoElement.muted = false;
    
    // Update state for this video
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], playing: true, muted: false }
    }));
    
    // Play the video
    videoElement.currentTime = 0;
    videoElement.play().catch(error => {
      console.error(`Error auto-playing video ${videoId}:`, error);
      // If autoplay fails, try with muted
      videoElement.muted = true;
      setVideoStates(prev => ({
        ...prev,
        [videoId]: { ...prev[videoId], playing: false, muted: true, error: 'Autoplay failed' }
      }));
      
      // Try playing muted
      videoElement.play().catch(mutedError => {
        console.warn(`Muted autoplay also failed for video ${videoId}:`, mutedError);
        setVideoStates(prev => ({
          ...prev,
          [videoId]: { ...prev[videoId], playing: false, muted: true, error: 'Autoplay blocked' }
        }));
      });
    });
    
    setCurrentPlayingVideo(videoId);
  };

  const value: GlobalVideoContextType = {
    videoStates,
    currentPlayingVideo,
    updateVideoState,
    setCurrentPlayingVideo,
    muteAllVideos,
    pauseAllVideos,
    pauseAllExcept,
    autoPlayVideo
  };

  return (
    <GlobalVideoContext.Provider value={value}>
      {children}
    </GlobalVideoContext.Provider>
  );
};
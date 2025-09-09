import React, { useState, useRef, useEffect } from 'react';
import { 
  PlayArrow, 
  Pause, 
  Download, 
  Delete, 
  VolumeUp, 
  Warning,
  AccessTime,
  Mic,
  AudioFile
} from '@mui/icons-material';
import { 
  CircularProgress, 
  Card, 
  CardContent, 
  Box, 
  Typography, 
  Chip,
  Alert,
  Button,
  Slider,
  IconButton
} from '@mui/material';
import { InterviewRecording, modernInterviewRecordingService } from '../services/modernInterviewRecordingService';

interface ModernInterviewRecordingPlayerProps {
  recording: InterviewRecording;
  onDelete?: (recordingId: string) => void;
  onUpdate?: () => void;
}

export const ModernInterviewRecordingPlayer: React.FC<ModernInterviewRecordingPlayerProps> = ({
  recording: initialRecording,
  onDelete,
  onUpdate
}) => {
  const [recording, setRecording] = useState<InterviewRecording>(initialRecording);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Load audio data when component mounts or recording ID changes
  useEffect(() => {
    loadAudioData();
  }, [recording.id]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setError(null);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      console.error('❌ Audio playback error');
      setError('Failed to play audio');
      setIsPlaying(false);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [recording.audioUrl]);

  const loadAudioData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Loading audio data for recording:', recording.id);

      // Get fresh recording data with audio blob
      const freshRecording = await modernInterviewRecordingService.getRecording(recording.id);
      
      if (!freshRecording) {
        throw new Error('Recording not found');
      }

      if (!freshRecording.audioBlob) {
        throw new Error('No audio data available');
      }

      setRecording(freshRecording);
      console.log('✅ Audio data loaded successfully');

    } catch (error: any) {
      console.error('❌ Failed to load audio data:', error);
      setError(error.message || 'Failed to load audio');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !recording.audioUrl) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('❌ Playback failed:', error);
      setError('Playback failed');
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleDownload = () => {
    if (!recording.audioBlob) {
      setError('No audio data available for download');
      return;
    }

    try {
      const url = URL.createObjectURL(recording.audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.jobTitle}_${recording.companyName}_interview.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Download initiated for recording:', recording.id);
    } catch (error) {
      console.error('❌ Download failed:', error);
      setError('Download failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      
      const success = await modernInterviewRecordingService.deleteRecording(recording.id);
      
      if (success) {
        console.log('✅ Recording deleted successfully');
        onDelete?.(recording.id);
      } else {
        throw new Error('Delete operation failed');
      }

    } catch (error: any) {
      console.error('❌ Failed to delete recording:', error);
      setError(error.message || 'Failed to delete recording');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'recording':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <AudioFile className="h-4 w-4" />;
      case 'recording':
        return <Mic className="h-4 w-4" />;
      case 'processing':
        return <CircularProgress className="h-4 w-4" />;
      case 'failed':
        return <Warning className="h-4 w-4" />;
      default:
        return <AudioFile className="h-4 w-4" />;
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isPlayable = recording.status === 'completed' && recording.audioUrl && !error;

  return (
    <Card sx={{ mb: 2, transition: 'all 0.2s ease', '&:hover': { boxShadow: 4 } }}>
      <CardContent sx={{ p: 3 }}>
        {/* Recording Header */}
        <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {recording.jobTitle}
              </Typography>
              <Chip
                icon={getStatusIcon(recording.status)}
                label={recording.status}
                size="small"
                color={
                  recording.status === 'completed' ? 'success' : 
                  recording.status === 'processing' ? 'warning' :
                  recording.status === 'failed' ? 'error' : 'default'
                }
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {recording.companyName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<AccessTime sx={{ fontSize: '0.75rem' }} />}
                label={`${recording.timestamp.toLocaleDateString()} at ${recording.timestamp.toLocaleTimeString()}`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={formatTime(recording.duration / 1000)}
                size="small"
                variant="outlined"
              />
              <Chip
                label={formatFileSize(recording.metadata.fileSize)}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${recording.questions.length} questions`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={loadAudioData}>
                Try reloading
              </Button>
            }
          >
            {error}
          </Alert>
        )}

      {/* Audio Player */}
      {isPlayable && (
        <>
          <audio
            ref={audioRef}
            src={recording.audioUrl}
            preload="metadata"
          />

          {/* Progress Bar */}
          <div className="mb-4">
            <div
              ref={progressRef}
              className="h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                disabled={isLoading}
                className="flex items-center justify-center h-10 w-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full transition-colors"
              >
                {isLoading ? (
                  <CircularProgress className="h-4 w-4" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <PlayArrow className="h-4 w-4 ml-0.5" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <VolumeUp className="h-4 w-4 text-gray-600" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!recording.audioBlob}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-red-100 hover:bg-red-200 disabled:bg-red-50 text-red-700 rounded-md transition-colors"
              >
                {isDeleting ? (
                  <CircularProgress className="h-4 w-4" />
                ) : (
                  <Delete className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Loading State for Non-Completed Recordings */}
      {!isPlayable && recording.status !== 'failed' && (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <div className="text-center">
            <CircularProgress className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">
              {recording.status === 'recording' ? 'Recording in progress...' :
               recording.status === 'processing' ? 'Processing recording...' :
               'Loading...'}
            </p>
          </div>
        </div>
      )}

      {/* Failed State */}
      {recording.status === 'failed' && (
        <div className="flex items-center justify-center py-8 text-red-500">
          <div className="text-center">
            <Warning className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Recording failed or corrupted</p>
            <button
              onClick={loadAudioData}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Try reloading
            </button>
          </div>
        </div>
      )}

      {/* Questions Preview */}
      {recording.questions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Interview Questions</h4>
          <div className="space-y-1">
            {recording.questions.slice(0, 3).map((question, index) => (
              <p key={index} className="text-xs text-gray-600 truncate">
                {index + 1}. {question.question}
              </p>
            ))}
            {recording.questions.length > 3 && (
              <p className="text-xs text-gray-500">
                ... and {recording.questions.length - 3} more questions
              </p>
            )}
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
};

export default ModernInterviewRecordingPlayer;
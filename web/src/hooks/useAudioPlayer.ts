import { useState, useEffect, useRef, useCallback } from 'react';

interface AudioTrack {
  id: string;
  url: string;
  name: string;
  gainNode?: GainNode;
  sourceNode?: AudioBufferSourceNode;
  buffer?: AudioBuffer;
}

interface UseAudioPlayerProps {
  tracks: { id: string; url: string; name: string }[];
}

export function useAudioPlayer({ tracks: initialTracks }: UseAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const trackNodesRef = useRef<Map<string, { source: AudioBufferSourceNode | null, gain: GainNode }>>(new Map());
  const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());

  // Initialize Audio Context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Load Audio Buffers
  useEffect(() => {
    const loadTracks = async () => {
      if (!audioContextRef.current) return;

      try {
        const loadPromises = initialTracks.map(async (track) => {
          const response = await fetch(track.url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
          buffersRef.current.set(track.id, audioBuffer);
          
          // Create Gain Node for each track immediately
          const gainNode = audioContextRef.current!.createGain();
          gainNode.connect(audioContextRef.current!.destination);
          
          trackNodesRef.current.set(track.id, { source: null, gain: gainNode });
          
          // Set duration from the first track (assuming all are same length)
          if (track.id === initialTracks[0].id) {
            setDuration(audioBuffer.duration);
          }
        });

        await Promise.all(loadPromises);
        setIsReady(true);
      } catch (error) {
        console.error("Error loading audio tracks:", error);
      }
    };

    if (audioContextRef.current) {
      loadTracks();
    }
  }, [initialTracks]);

  // Play Function
  const play = useCallback(() => {
    if (!audioContextRef.current || !isReady) return;

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const startTime = audioContextRef.current.currentTime;
    // Adjust start time based on where we paused
    const offset = pauseTimeRef.current;
    startTimeRef.current = startTime - offset;

    initialTracks.forEach(track => {
      const buffer = buffersRef.current.get(track.id);
      const nodes = trackNodesRef.current.get(track.id);
      
      if (buffer && nodes) {
        // Create new source node (they are one-time use)
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = buffer;
        source.connect(nodes.gain);
        source.start(0, offset);
        
        // Update reference
        nodes.source = source;
        trackNodesRef.current.set(track.id, nodes);
      }
    });

    setIsPlaying(true);
  }, [initialTracks, isReady]);

  // Pause Function
  const pause = useCallback(() => {
    if (!audioContextRef.current || !isPlaying) return;

    initialTracks.forEach(track => {
      const nodes = trackNodesRef.current.get(track.id);
      if (nodes?.source) {
        nodes.source.stop();
        nodes.source = null;
      }
    });

    // Calculate pause position
    pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
    setIsPlaying(false);
  }, [initialTracks, isPlaying]);

  // Stop Function
  const stop = useCallback(() => {
    if (!audioContextRef.current) return;

    initialTracks.forEach(track => {
      const nodes = trackNodesRef.current.get(track.id);
      if (nodes?.source) {
        nodes.source.stop();
        nodes.source = null;
      }
    });

    pauseTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  }, [initialTracks]);

  // Seek Function
  const seek = useCallback((time: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) pause();
    pauseTimeRef.current = time;
    setCurrentTime(time);
    if (wasPlaying) play();
  }, [isPlaying, pause, play]);

  // Volume Control
  const setVolume = useCallback((trackId: string, value: number) => {
    const nodes = trackNodesRef.current.get(trackId);
    if (nodes && nodes.gain) {
      nodes.gain.gain.value = value;
    }
  }, []);

  // Time Update Loop
  useEffect(() => {
    let animationFrameId: number;

    const updateTime = () => {
      if (isPlaying && audioContextRef.current) {
        const now = audioContextRef.current.currentTime;
        const newTime = now - startTimeRef.current;
        
        if (newTime >= duration) {
          stop();
        } else {
          setCurrentTime(newTime);
          animationFrameId = requestAnimationFrame(updateTime);
        }
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateTime);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, duration, stop]);

  return {
    isPlaying,
    isReady,
    currentTime,
    duration,
    play,
    pause,
    stop,
    seek,
    setVolume
  };
}

"use client";

import Link from "next/link";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// Dynamically import PDFViewer to avoid SSR issues with canvas
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

const tracks = [
  { id: "backing", name: "Accompaniment", url: "/sample/accompaniment.mp3" },
  { id: "vocal", name: "Vocal Guide", url: "/sample/vocal.mp3" },
];

export default function PracticePage({ params }: { params: { id: string } }) {
  const pdfUrl = "/sample/score.pdf";
  const { user } = useAuth();
  const router = useRouter();
  
  const { 
    isPlaying, 
    isReady, 
    currentTime, 
    duration, 
    play, 
    pause, 
    stop: stopPlayback,
    seek, 
    setVolume 
  } = useAudioPlayer({ tracks });

  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording
  } = useAudioRecorder();

  // State to manage review mode (playing back recording)
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewAudio, setReviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Evaluation State
  const [rating, setRating] = useState<number>(0);
  const [userNotes, setUserNotes] = useState("");

  // Effect to handle recording playback synchronization
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      setReviewAudio(audio);
    }
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
      if (isReviewing && reviewAudio) {
        reviewAudio.pause();
      }
    } else {
      play();
      if (isReviewing && reviewAudio) {
        reviewAudio.currentTime = currentTime;
        reviewAudio.play();
      }
    }
  };

  const handleSeek = (value: number[]) => {
    seek(value[0]);
    if (isReviewing && reviewAudio) {
      reviewAudio.currentTime = value[0];
    }
  };

  const handleStartRecording = async () => {
    // Reset state
    setRating(0);
    setUserNotes("");
    
    // Rewind to start
    seek(0);
    // Start recording first to ensure mic is ready
    await startRecording();
    // Then start playback
    play();
  };

  const handleStopRecording = () => {
    stopRecording();
    stopPlayback();
    // Automatically switch to review mode
    setIsReviewing(true);
  };

  const handleToggleReview = () => {
    if (isReviewing) {
      setIsReviewing(false);
      // Stop any review audio
      if (reviewAudio) {
        reviewAudio.pause();
        reviewAudio.currentTime = 0;
      }
    } else {
      setIsReviewing(true);
    }
  };

  const handleSaveRecording = async () => {
    if (!user) {
      alert("Please login to save recordings");
      router.push("/login");
      return;
    }

    if (!audioBlob) return;

    setIsUploading(true);
    try {
      const filename = `user-${user.id}/${Date.now()}-${params.id}.webm`;
      
      // 1. Upload file to Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-recordings')
        .upload(filename, audioBlob);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-recordings')
        .getPublicUrl(filename);

      // 3. Insert record into database
      const mockSongId = "00000000-0000-0000-0000-000000000000"; 
      
      const { error: dbError } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          song_id: mockSongId, 
          file_url: publicUrl,
          duration: recordingTime,
          rating: rating > 0 ? rating : null,
          user_notes: userNotes
        });

      if (dbError) {
        console.warn("DB Insert failed:", dbError);
      }

      alert("Recording saved successfully!");
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert("Failed to save recording: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/library">← Back</Link>
        </Button>
        <h1 className="text-lg font-semibold truncate">
          {isRecording ? (
            <span className="text-red-500 animate-pulse">● Recording... {formatTime(recordingTime)}</span>
          ) : (
            `Practice Session: Song ${params.id}`
          )}
        </h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <div className="flex-grow bg-muted/20 relative flex flex-col overflow-hidden h-[60vh] md:h-auto">
           <PDFViewer url={pdfUrl} />
        </div>

        <div className="h-auto md:w-96 bg-background border-t md:border-t-0 flex flex-col p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Recording Complete Actions & Evaluation */}
            {audioUrl && !isRecording && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                <h3 className="font-medium text-sm">Session Complete</h3>
                
                {/* Evaluation Form */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Self Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                          onClick={() => setRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="How did it go? (e.g., Struggled with bar 42)"
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      className="h-20"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant={isReviewing ? "default" : "outline"} 
                    size="sm" 
                    className="flex-1"
                    onClick={handleToggleReview}
                  >
                    {isReviewing ? "Review Mode" : "Listen"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={handleSaveRecording}
                    disabled={isUploading}
                  >
                    {isUploading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            )}

            {/* Playback Controls */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">
                {isReviewing ? "Review Playback" : "Playback"}
              </h3>
              <div className="flex justify-center gap-4 py-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => seek(Math.max(0, currentTime - 5))}
                  disabled={!isReady || isRecording}
                >
                  ⏮
                </Button>
                <Button 
                  size="icon" 
                  className={`h-12 w-12 rounded-full text-xl ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
                  onClick={isRecording ? handleStopRecording : togglePlay}
                  disabled={!isReady && !isRecording}
                >
                  {isRecording ? '⏹' : (isPlaying ? '⏸' : '▶')}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => seek(Math.min(duration, currentTime + 5))}
                  disabled={!isReady || isRecording}
                >
                  ⏭
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <Slider 
                  value={[currentTime]} 
                  max={duration || 100} 
                  step={0.1} 
                  className="flex-grow" 
                  onValueChange={handleSeek}
                  disabled={!isReady || isRecording}
                />
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Mixer */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm">Mixer</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Accompaniment</span>
                  <span>70%</span>
                </div>
                <Slider 
                  defaultValue={[70]} 
                  max={100} 
                  step={1} 
                  onValueChange={(v) => setVolume('backing', v[0] / 100)}
                  disabled={isRecording}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Vocal Guide</span>
                  <span>70%</span>
                </div>
                <Slider 
                  defaultValue={[70]} 
                  max={100} 
                  step={1} 
                  onValueChange={(v) => setVolume('vocal', v[0] / 100)}
                  disabled={isRecording}
                />
              </div>

              {/* Review Volume (My Recording) */}
              {isReviewing && (
                 <div className="space-y-2">
                 <div className="flex justify-between text-xs font-semibold text-primary">
                   <span>My Recording</span>
                   <span>100%</span>
                 </div>
                 <Slider 
                   defaultValue={[100]} 
                   max={100} 
                   step={1} 
                   onValueChange={(v) => {
                     if (reviewAudio) reviewAudio.volume = v[0] / 100;
                   }}
                 />
               </div>
              )}
            </div>

            {/* Recording Start Button */}
            {!isRecording && !audioUrl && (
              <div className="pt-4 mt-auto">
                <Button 
                  variant="destructive" 
                  className="w-full h-12 text-lg font-medium shadow-md"
                  onClick={handleStartRecording}
                  disabled={!isReady}
                >
                  ● Start Recording
                </Button>
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  Please use headphones for best results
                </p>
              </div>
            )}
             
             {/* Re-Record Button */}
             {!isRecording && audioUrl && (
              <div className="pt-4 mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Discard current recording and start over?")) {
                      handleStartRecording();
                    }
                  }}
                >
                  ↻ Re-Record
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

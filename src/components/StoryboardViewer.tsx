import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StorySegment {
  id: number;
  sceneDescription: string;
  narration: string;
  caption: string;
  videoUrl?: string;
  audioUrl?: string;
  imageUrl?: string;
}

interface StoryboardViewerProps {
  segments: StorySegment[];
}

// Helper component for icons (defined here so it is available before usage)
function Film({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

export const StoryboardViewer = ({ segments }: StoryboardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const driftTimerRef = useRef<number | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const [videoError, setVideoError] = useState<string | null>(null);

  const currentSegment = segments[currentIndex];
  const progress = ((currentIndex + 1) / segments.length) * 100;

  const handleNext = () => {
    if (currentIndex < segments.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Control the HTMLVideoElement when isPlaying changes
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const a = audioRef.current;

    const clearDrift = () => {
      if (driftTimerRef.current) {
        clearInterval(driftTimerRef.current);
        driftTimerRef.current = null;
      }
    };

    if (isPlaying) {
      // Don't start audio immediately if videoSrc is not yet available.
      // A separate effect (watching [isPlaying, videoSrc]) will start audio+video when ready.
      // Set up drift correction timer (will be used once playing starts)
      if (!driftTimerRef.current) {
        driftTimerRef.current = window.setInterval(() => {
          const vv = videoRef.current;
          const aa = audioRef.current;
          if (!vv || !aa) return;
          const diff = aa.currentTime - vv.currentTime;
          if (Math.abs(diff) > 0.15) {
            try { vv.currentTime = aa.currentTime; } catch {}
          }
        }, 250) as unknown as number;
      }

      return () => {
        clearDrift();
      };
    } else {
      v.pause();
      a?.pause();
      clearDrift();
    }
  }, [isPlaying, currentIndex]);

  // Start audio then video when both isPlaying and a playable videoSrc are available
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return;

    let mounted = true;
    const onAudioCanPlay = () => {
      if (!mounted) return;
      try {
        // align and start video
        v.muted = true;
        v.currentTime = a.currentTime || 0;
        v.play().catch(() => {});
      } catch {}
    };
    const onVideoCanPlay = () => {
      if (!mounted) return;
      try {
        // if no audio, play with sound
        if (!a || !a.src) {
          v.muted = false;
          v.play().catch(() => {});
        }
      } catch {}
    };

    const startPlayback = async () => {
      try {
        if (a.src) {
          // Try to play audio first. If browser disallows, this may reject.
          await a.play().catch(() => Promise.reject(new Error('audio-play-failed')));
          // when audio is playing, align and play video
          try { v.muted = true; v.currentTime = a.currentTime || 0; await v.play().catch(() => {}); } catch {}
        } else {
          // no audio -> play video
          await v.play().catch(() => {});
        }
      } catch (err) {
        // fallback: attach canplay listeners so when media becomes ready we start
        try { a.addEventListener('canplay', onAudioCanPlay); } catch {}
        try { v.addEventListener('canplay', onVideoCanPlay); } catch {}
      }
    };

    if (isPlaying && videoSrc) {
      startPlayback();
    }

    return () => {
      mounted = false;
      try { a.removeEventListener('canplay', onAudioCanPlay); } catch {}
      try { v.removeEventListener('canplay', onVideoCanPlay); } catch {}
    };
  }, [isPlaying, videoSrc]);

  useEffect(() => {
    // On segment change: stop previous playback, clear timers, set new audio src and reset video src
    const prevV = videoRef.current;
    const prevA = audioRef.current;
    if (prevV) {
      try { prevV.pause(); prevV.currentTime = 0; } catch {}
    }
    if (prevA) {
      try { prevA.pause(); prevA.currentTime = 0; } catch {}
    }
    if (driftTimerRef.current) {
      clearInterval(driftTimerRef.current);
      driftTimerRef.current = null;
    }

    // prepare new media
    const cur = segments[currentIndex] as any;
    if (audioRef.current) {
      try {
        if (cur && cur.audioUrl) {
          audioRef.current.src = cur.audioUrl;
          audioRef.current.load();
        } else {
          audioRef.current.removeAttribute('src');
          audioRef.current.load();
        }
      } catch {}
    }

    // clear video src until probe finds one
    setVideoSrc(undefined);
    setVideoError(null);
  }, [currentIndex]);

  // When current segment changes, probe candidate URLs to find a playable source
  useEffect(() => {
    let mounted = true;
    setVideoError(null);
    setVideoSrc(undefined);
    const current = segments[currentIndex];
    if (!current) return;

    const candidates: string[] = [];
    if (current.videoUrl) candidates.push(current.videoUrl);
    // try backend API streaming endpoint if storyId is available
    if ((current as any).storyId) {
      candidates.push(`/api/videos/${(current as any).storyId}/${current.id}`);
    }
    // if originalVideoPath exists and is absolute, try to serve via file path (may not work in browser)
    if ((current as any).originalVideoPath) {
      // The repo file path won't be directly fetchable; we won't include it here.
    }

    // probe each candidate sequentially (only video)
    const probe = async () => {
      for (const url of candidates) {
        try {
          const resp = await fetch(url, { method: 'HEAD' });
          if (!mounted) return;
          if (resp.ok && resp.headers.get('content-type')?.startsWith('video')) {
            setVideoSrc(url);
            return;
          }
          // if HEAD not allowed, try GET with range
          if (resp.status === 405 || resp.status === 0) {
            const r2 = await fetch(url);
            if (!mounted) return;
            if (r2.ok && r2.headers.get('content-type')?.startsWith('video')) {
              setVideoSrc(url);
              return;
            }
          }
        } catch (err) {
          // continue to next candidate
        }
      }

      if (mounted) setVideoError('No playable video found for this scene.');
    };

    probe();

    return () => {
      mounted = false;
    };
  }, [currentIndex, segments]);

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-6xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Scene {currentIndex + 1} of {segments.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Video Card */}
        <Card className="overflow-hidden shadow-elegant bg-card border-border">
          {/* Video/Scene Display */}
          <div className="relative aspect-video bg-gradient-hero flex items-center justify-center">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-cover"
                controls={true}
                playsInline
              />
            ) : (
              <div className="text-center p-12">
                <Film className="h-24 w-24 text-primary mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">
                  {currentSegment.sceneDescription}
                </p>
                {videoError ? (
                  <p className="mt-4 text-sm text-red-500">{videoError}</p>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">Video checking...</p>
                )}
              </div>
            )}

            {/* Caption Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-6">
              <p className="text-lg text-center font-medium">
                {currentSegment.caption}
              </p>
            </div>

            {/* Hidden audio element for narration/background audio */}
            <audio ref={audioRef} hidden preload="auto" />

            {/* Play Button Overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-background/20 hover:bg-background/30 transition-colors group"
            >
              {isPlaying ? (
                <Pause className="h-16 w-16 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              ) : (
                <Play className="h-16 w-16 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

          {/* Controls */}
          <div className="p-6 bg-card">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex-1"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button
                onClick={togglePlay}
                className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Play
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === segments.length - 1}
                className="flex-1"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Narration Text */}
            <div className="mt-6 p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground italic">
                "{currentSegment.narration}"
              </p>
            </div>
          </div>
        </Card>

        {/* Scene Thumbnails */}
        <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
          {segments.map((segment, index) => (
            <button
              key={segment.id}
              onClick={() => {
                setCurrentIndex(index);
                setIsPlaying(false);
              }}
              className={`
                flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden border-2 transition-all
                ${index === currentIndex 
                  ? 'border-primary shadow-glow scale-110' 
                  : 'border-border hover:border-primary/50 opacity-60 hover:opacity-100'
                }
              `}
            >
              <div className="w-full h-full bg-gradient-hero flex items-center justify-center">
                {segment.imageUrl ? (
                  <img src={segment.imageUrl} alt={`scene-${index + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-medium">Scene {index + 1}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// Helper component for icons (defined here since it's used in this component)
// Film is declared earlier

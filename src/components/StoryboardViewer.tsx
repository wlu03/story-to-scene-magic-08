import { useState } from "react";
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
}

interface StoryboardViewerProps {
  segments: StorySegment[];
}

export const StoryboardViewer = ({ segments }: StoryboardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
            {currentSegment.videoUrl ? (
              <video
                src={currentSegment.videoUrl}
                className="w-full h-full object-cover"
                controls={false}
                autoPlay={isPlaying}
              />
            ) : (
              <div className="text-center p-12">
                <Film className="h-24 w-24 text-primary mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">
                  {currentSegment.sceneDescription}
                </p>
              </div>
            )}

            {/* Caption Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-6">
              <p className="text-lg text-center font-medium">
                {currentSegment.caption}
              </p>
            </div>

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
                <span className="text-xs font-medium">Scene {index + 1}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// Helper component for icons (defined here since it's used in this component)
const Film = ({ className }: { className?: string }) => (
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

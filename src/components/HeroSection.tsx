import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-storyflow.jpg";

interface HeroSectionProps {
  onUploadClick: () => void;
}

export const HeroSection = ({ onUploadClick }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-amber bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700">
          Storyflow Engine
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          Transform your stories into cinematic video experiences. Upload text or PDF, 
          and watch as AI brings your narrative to life with visuals, narration, and interactive scenes.
        </p>

        <Button 
          size="lg"
          onClick={onUploadClick}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg shadow-glow hover:shadow-glow hover:scale-105 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
        >
          <Upload className="mr-2 h-5 w-5" />
          Start Your Story
        </Button>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          {["AI Video Generation", "Voice Narration", "Interactive Scenes"].map((feature) => (
            <div
              key={feature}
              className="px-6 py-3 rounded-full bg-secondary/50 backdrop-blur-sm border border-border text-sm font-medium"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

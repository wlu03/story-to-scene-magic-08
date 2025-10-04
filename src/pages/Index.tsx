import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { UploadSection } from "@/components/UploadSection";
import { ProcessingView } from "@/components/ProcessingView";
import { StoryboardViewer } from "@/components/StoryboardViewer";

type ViewState = "hero" | "upload" | "processing" | "viewer";

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewState>("hero");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Demo data for the storyboard viewer
  const demoSegments = [
    {
      id: 1,
      sceneDescription: "A peaceful morning in a small village",
      narration: "The sun rose gently over the quiet village, painting the sky in shades of gold and pink.",
      caption: "Chapter 1: A New Beginning"
    },
    {
      id: 2,
      sceneDescription: "A young adventurer preparing for a journey",
      narration: "Maya packed her belongings carefully, her heart filled with both excitement and uncertainty.",
      caption: "The Journey Begins"
    },
    {
      id: 3,
      sceneDescription: "Walking through an enchanted forest",
      narration: "The forest path twisted ahead, mysterious and inviting, filled with the sounds of nature.",
      caption: "Into the Unknown"
    }
  ];

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setCurrentView("processing");

    // Simulate processing with progress updates
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setCurrentView("viewer"), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 800);
  };

  const renderView = () => {
    switch (currentView) {
      case "hero":
        return <HeroSection onUploadClick={() => setCurrentView("upload")} />;
      
      case "upload":
        return (
          <UploadSection
            onFileSelect={handleFileSelect}
            onCancel={() => setCurrentView("hero")}
          />
        );
      
      case "processing":
        return (
          <ProcessingView
            progress={processingProgress}
            currentStep="processing"
          />
        );
      
      case "viewer":
        return <StoryboardViewer segments={demoSegments} />;
      
      default:
        return <HeroSection onUploadClick={() => setCurrentView("upload")} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderView()}
    </div>
  );
};

export default Index;

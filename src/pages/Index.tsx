import { useState, useEffect } from "react";
// Load sample story JSON directly from repository data (frontend-only)
import sampleStory from "../../backend/data/stories/87d4dadb-90e9-4f9b-9d31-a094f9430aed.json";

// Discover any video files placed in the repository under backend/data/videos/sample-story
// Vite's import.meta.glob will expose their built URLs so we can include newly added files
const videoFilesLoaders = import.meta.glob('../../backend/data/videos/sample-story/*.mp4', { as: 'url' }) as Record<string, () => Promise<string>>;
// Discover any audio files placed in backend/data/Audio book so we can pick up newly added audio
const audioFilesLoaders = import.meta.glob('../../backend/data/Audio book/*.mp3', { as: 'url' }) as Record<string, () => Promise<string>>;
import { HeroSection } from "@/components/HeroSection";
import { UploadSection } from "@/components/UploadSection";
import { ProcessingView } from "@/components/ProcessingView";
import { StoryboardViewer } from "@/components/StoryboardViewer";

type ViewState = "hero" | "upload" | "processing" | "viewer";

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewState>("hero");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [segments, setSegments] = useState<any[] | null>(null);

  // Demo data fallback
  const demoSegments = [
    {
      id: 1,
      sceneDescription: "A peaceful morning in a small village",
      narration: "The sun rose gently over the quiet village, painting the sky in shades of gold and pink.",
      caption: "Chapter 1: A New Beginning"
    },
  ];

  // Prepare segments from local sample JSON so frontend can show/play them
  useEffect(() => {
    (async () => {
      try {
        const storyData: any = sampleStory as any;
        const prepared = (storyData.sections || storyData.segments || []).map((s: any) => ({
        id: s.id,
        sceneDescription: s.sceneDescription || s.script || s.sectionName,
        narration: s.script || s.sceneDescription || '',
        caption: s.sectionName || `Scene ${s.id}`,
        // Point to the files inside the repo so the dev server can serve them if available
        // e.g. /backend/data/sample-story/lion_and_rabbit_section_1/video.mp4
        // Use shared videos folder (backend/data/videos/sample-story/segment-<n>.mp4)
        videoUrl: `/backend/data/videos/sample-story/segment-${s.id}.mp4`,
        // Keep image pointing to the sample-story folder (if background.png exists)
        imageUrl: `/backend/data/sample-story/${s.sectionName}/background.png`,
        // audioUrl will be attached after we discover audio files below; leave undefined for now
        audioUrl: undefined,
        storyId: storyData.id,
        originalVideoPath: s.videoPath,
      }));

      // Build audio map by filename -> url for quick lookup
      const audioLoaders = Object.entries(audioFilesLoaders || {});
      const audioMap: Record<string, string> = {};
      await Promise.all(audioLoaders.map(async ([path, fn]) => {
        try {
          const url = await fn();
          const m = url.match(/([^/\\]+\.mp3)$/);
          if (m) audioMap[m[1]] = url;
        } catch {}
      }));

      // Merge in any discovered video files that aren't represented in the JSON.
      // Extract segment id from filenames like 'segment-8.mp4'.
      const loaders = Object.values(videoFilesLoaders || {});
      const discovered: { id: number; url: string }[] = [];
      await Promise.all(loaders.map(async (fn) => {
        try {
          const url = await fn();
          const m = url.match(/segment-(\d+)\.mp4$/);
          if (m) discovered.push({ id: Number(m[1]), url });
        } catch {}
      }));

      for (const d of discovered) {
        if (!prepared.find((p: any) => Number(p.id) === d.id)) {
          // determine audio URL if available
          const audioCandidates = [`audio_${d.id}.mp3`, `audio_${d.id} copy.mp3`, `audio_${d.id} copy 1.mp3`];
          const audioUrl = audioCandidates.map((c) => audioMap[c]).find(Boolean) || `/backend/data/Audio%20book/audio_${d.id}.mp3`;
          // add a minimal segment entry so the viewer can show/play it
          prepared.push({
            id: d.id,
            sceneDescription: `Discovered video segment ${d.id}`,
            narration: '',
            caption: `Scene ${d.id}`,
            videoUrl: d.url,
            imageUrl: `/backend/data/sample-story/scene_${d.id}/background.png`,
            audioUrl,
            storyId: storyData.id,
            originalVideoPath: undefined,
          });
        }
      }

      // Sort by id to keep chronological order
      prepared.sort((a: any, b: any) => Number(a.id) - Number(b.id));

      // Attach audioUrl to all prepared segments using discovered audioMap when available.
      for (const p of prepared) {
        const id = Number(p.id);
        const candidates = [
          `audio_${id}.mp3`,
          `audio_${id} copy.mp3`,
          `audio_${id} copy 1.mp3`,
          `audio_${id}.mp3`
        ];
        const found = candidates.map((c) => audioMap[c]).find(Boolean);
        p.audioUrl = found || `/backend/data/Audio%20book/audio_${id}.mp3`;
      }

        setSegments(prepared);
      } catch (err) {
        console.warn('Failed to load local sample story JSON', err);
      }
    })();
  }, []);

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
        return <StoryboardViewer segments={segments ?? demoSegments} />;
      
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

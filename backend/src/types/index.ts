// Shared types for the application

export interface StorySegment {
  id: number;
  sceneDescription: string;
  narration: string;
  caption: string;
  imagePrompt?: string;
  videoPath?: string;
  videoUrl?: string;
  duration?: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

export interface StoryStyle {
  characters: Array<{
    name: string;
    description: string;
    physicalTraits: string;
  }>;
  setting: {
    location: string;
    timeperiod: string;
    atmosphere: string;
  };
  visualStyle: {
    artStyle: string;
    colorPalette: string;
    cinematography: string;
  };
}

export interface StoryData {
  id: string;
  originalFilename: string;
  uploadedAt: string;
  status: 'uploaded' | 'analyzing' | 'extracting_style' | 'generating_reference_image' | 'generating_segments' | 'generating_videos' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  textContent?: string;
  styleInfo?: StoryStyle;
  referenceImagePath?: string;
  referenceImageUrl?: string;
  segments: StorySegment[];
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  storyId: string;
  message: string;
}

export interface ProcessingStatus {
  storyId: string;
  status: StoryData['status'];
  progress: number;
  currentStep?: string;
  segments?: StorySegment[];
  styleInfo?: StoryStyle;
  error?: string;
}


export interface GeminiVeoRequest {
  prompt: string; // The prompt to generate the video
  duration?: number; // The duration of the video
  aspectRatio?: '16:9' | '9:16'; // The aspect ratio of the video
  resolution?: '720p' | '1080p';
  negativePrompt?: string; // the negative prompt to avoid
  personGeneration?: 'allow_adult' | 'disallow';
  seed?: number; // the seed for the video
  sampleCount?: number; // the number of samples to generate
  /** Optional image-to-video seed frame. Provide one of uri or imageBytes+mimeType. */
  image?: {
    uri?: string;              // e.g., https://...
    imageBytes?: string;       // base64-encoded image
    mimeType?: string;         // e.g., 'image/png', required if imageBytes is set
  };
  model?: 'veo-3.0-generate-001' | 'veo-3.0-fast-generate-001'; // the model to use
}

export interface GeminiVeoResponse {
  success: boolean;
  videoUrl?: string;
  videoPath?: string;
  error?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}


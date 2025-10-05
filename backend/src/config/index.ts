import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  google: {
    apiKey: process.env.GOOGLE_API_KEY || '',
  },
  
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'kC1WIuSSgwH2T8iOV4iJ',
    modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
  },
  
  storage: {
    dataDir: process.env.DATA_DIR || path.join(__dirname, '../../data'),
    uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../data/uploads'),
    storiesDir: process.env.STORIES_DIR || path.join(__dirname, '../../data/stories'),
    videosDir: process.env.VIDEOS_DIR || path.join(__dirname, '../../data/videos'),
    imagesDir: process.env.IMAGES_DIR || path.join(__dirname, '../../data/images'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  },
  
  veo: {
    model: process.env.VEO_MODEL || 'gemini-2.0-flash-exp',
    maxRetries: parseInt(process.env.VEO_MAX_RETRIES || '3'),
    timeout: parseInt(process.env.VEO_TIMEOUT || '300000'), // 5 minutes default
  },
  
  segmentation: {
    // Set to 0 for automatic calculation based on story length
    // Or set a fixed number (3-12) to override
    fixedSegmentCount: parseInt(process.env.FIXED_SEGMENT_COUNT || '0'),
    minSegments: parseInt(process.env.MIN_SEGMENTS || '3'),
    maxSegments: parseInt(process.env.MAX_SEGMENTS || '12'),
    wordsPerSegment: parseInt(process.env.WORDS_PER_SEGMENT || '150'),
  },
  features: {
    // Enable reference image generation (requires Vertex AI setup)
    enableReferenceImages: process.env.ENABLE_REFERENCE_IMAGES === 'true',
  },
} as const;

// Validation
export function validateConfig() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('Missing required environment variable: GOOGLE_API_KEY');
  }
}

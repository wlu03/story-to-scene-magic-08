import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  google: {
    apiKey: process.env.GOOGLE_API_KEY || '',
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
} as const;

// Validation
export function validateConfig() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('Missing required environment variable: GOOGLE_API_KEY');
  }
}

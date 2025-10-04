import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config';
import { fileParser } from '@/services/fileParser';
import { fileStorage } from '@/utils/fileStorage';
import { storyProcessor } from '@/services/processor';
import { StoryData, UploadResponse } from '@/types';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: config.storage.uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.storage.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .txt and .pdf files are allowed.'));
    }
  },
});

/**
 * POST /api/upload
 * Upload a story file
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const storyId = uuidv4();
    const file = req.file;

    // Parse file content
    const textContent = await fileParser.parseFile(file.path, file.mimetype);
    
    // Validate content
    if (!fileParser.validateContent(textContent)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file content. File must contain at least 100 characters.',
      });
    }

    // Clean content
    const cleanedContent = fileParser.cleanContent(textContent);

    // Create story data
    const storyData: StoryData = {
      id: storyId,
      originalFilename: file.originalname,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      progress: 0,
      textContent: cleanedContent,
      segments: [],
    };

    // Save story data
    await fileStorage.saveStoryData(storyId, storyData);

    // Start processing in background
    storyProcessor.processStory(storyId).catch(error => {
      console.error('Background processing error:', error);
    });

    const response: UploadResponse = {
      success: true,
      storyId,
      message: 'File uploaded successfully. Processing started.',
    };

    res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

export default router;


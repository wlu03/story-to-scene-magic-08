import { Router, Request, Response } from 'express';
import { fileStorage } from '@/utils/fileStorage';
import fs from 'fs';
import path from 'path';
import { config } from '@/config';

const router = Router();

/**
 * GET /api/images/:storyId/reference
 * Get the reference image for a story
 */
router.get('/:storyId/reference', async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    
    // Load story to verify it exists
    const story = await fileStorage.loadStoryData(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (!story.referenceImagePath) {
      return res.status(404).json({ error: 'Reference image not found' });
    }

    // Check if image file exists
    const imageExists = await fileStorage.fileExists(story.referenceImagePath);
    if (!imageExists) {
      return res.status(404).json({ error: 'Reference image file not found' });
    }

    // Serve the image
    res.sendFile(story.referenceImagePath);
  } catch (error) {
    console.error('Error serving reference image:', error);
    res.status(500).json({
      error: 'Failed to serve reference image',
    });
  }
});

/**
 * GET /api/images/:storyId/:segmentId
 * Get the thumbnail/image for a specific segment (if available)
 */
router.get('/:storyId/:segmentId', async (req: Request, res: Response) => {
  try {
    const { storyId, segmentId } = req.params;
    
    const imagePath = path.join(
      config.storage.imagesDir,
      storyId,
      `segment-${segmentId}.png`
    );

    // Check if image file exists
    const imageExists = await fileStorage.fileExists(imagePath);
    if (!imageExists) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Serve the image
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error serving segment image:', error);
    res.status(500).json({
      error: 'Failed to serve image',
    });
  }
});

export default router;


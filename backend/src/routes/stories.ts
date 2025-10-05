import { Router, Request, Response } from 'express';
import { fileStorage } from '@/utils/fileStorage';
import { storyProcessor } from '@/services/processor';
import { ProcessingStatus } from '@/types';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

/**
 * GET /api/stories/:id
 * Get story data by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const story = await fileStorage.loadStoryData(id);

    if (!story) {
      return res.status(404).json({
        error: 'Story not found',
      });
    }

    res.json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({
      error: 'Failed to fetch story',
    });
  }
});

/**
 * GET /api/stories/:id/status
 * Get processing status of a story
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const story = await fileStorage.loadStoryData(id);

    if (!story) {
      return res.status(404).json({
        error: 'Story not found',
      });
    }

    const status: ProcessingStatus = {
      storyId: story.id,
      status: story.status,
      progress: story.progress,
      currentStep: story.currentStep,
      sections: story.sections,
      segments: story.segments, // Legacy support
      styleInfo: story.styleInfo,
      error: story.error,
    };

    res.json(status);
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({
      error: 'Failed to fetch status',
    });
  }
});

/**
 * GET /api/stories
 * List all stories
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const stories = await fileStorage.listStories();
    res.json(stories);
  } catch (error) {
    console.error('Error listing stories:', error);
    res.status(500).json({
      error: 'Failed to list stories',
    });
  }
});

/**
 * DELETE /api/stories/:id
 * Delete a story
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await fileStorage.deleteStory(id);
    
    res.json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({
      error: 'Failed to delete story',
    });
  }
});

/**
 * POST /api/stories/:id/sections/:sectionId/background
 * Generate background image for a section
 */
router.post('/:id/sections/:sectionId/background', async (req: Request, res: Response) => {
  try {
    const { id, sectionId } = req.params;
    
    await storyProcessor.generateBackgroundImage(id, parseInt(sectionId));
    
    res.json({
      success: true,
      message: 'Background image generation started',
    });
  } catch (error) {
    console.error('Error generating background image:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate background image',
    });
  }
});

/**
 * POST /api/stories/:id/sections/:sectionId/audio
 * Generate audio for a section
 */
router.post('/:id/sections/:sectionId/audio', async (req: Request, res: Response) => {
  try {
    const { id, sectionId } = req.params;
    
    await storyProcessor.generateAudio(id, parseInt(sectionId));
    
    res.json({
      success: true,
      message: 'Audio generation started',
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate audio',
    });
  }
});

/**
 * POST /api/stories/:id/sections/:sectionId/video
 * Generate video for a section
 */
router.post('/:id/sections/:sectionId/video', async (req: Request, res: Response) => {
  try {
    const { id, sectionId } = req.params;
    
    await storyProcessor.generateVideo(id, parseInt(sectionId));
    
    res.json({
      success: true,
      message: 'Video generation started',
    });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate video',
    });
  }
});

/**
 * POST /api/stories/:id/videos/generate-all
 * Generate videos for all sections in a story
 */
router.post('/:id/videos/generate-all', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Start generation in background
    storyProcessor.generateAllVideos(id).catch(error => {
      console.error('Background video generation error:', error);
    });
    
    res.json({
      success: true,
      message: 'Video generation started for all sections',
    });
  } catch (error) {
    console.error('Error starting video generation:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to start video generation',
    });
  }
});

/**
 * GET /api/stories/:id/style
 * Get extracted style information for a story
 */
router.get('/:id/style', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const story = await fileStorage.loadStoryData(id);

    if (!story) {
      return res.status(404).json({
        error: 'Story not found',
      });
    }

    if (!story.styleInfo) {
      return res.status(404).json({
        error: 'Style information not yet extracted',
      });
    }

    res.json(story.styleInfo);
  } catch (error) {
    console.error('Error fetching style info:', error);
    res.status(500).json({
      error: 'Failed to fetch style information',
    });
  }
});

/**
 * POST /api/stories/:id/sections/:sectionId/background
 * Generate background image for a section
 */
router.post('/:id/sections/:sectionId/background', async (req: Request, res: Response) => {
  try {
    const { id, sectionId } = req.params;
    
    await storyProcessor.generateBackgroundImage(id, parseInt(sectionId));
    
    res.json({
      success: true,
      message: 'Background image generation started',
    });
  } catch (error) {
    console.error('Error generating background image:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate background image',
    });
  }
});

/**
 * POST /api/stories/:id/sections/:sectionId/audio
 * Generate audio for a section
 */
router.post('/:id/sections/:sectionId/audio', async (req: Request, res: Response) => {
  try {
    const { id, sectionId } = req.params;
    
    await storyProcessor.generateAudio(id, parseInt(sectionId));
    
    res.json({
      success: true,
      message: 'Audio generation started',
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate audio',
    });
  }
});

/**
 * POST /api/stories/:id/sections/:sectionId/video
 * Generate video for a section
 */
router.post('/:id/sections/:sectionId/video', async (req: Request, res: Response) => {
  try {
    const { id, sectionId } = req.params;
    
    await storyProcessor.generateVideo(id, parseInt(sectionId));
    
    res.json({
      success: true,
      message: 'Video generation started',
    });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate video',
    });
  }
});

export default router;


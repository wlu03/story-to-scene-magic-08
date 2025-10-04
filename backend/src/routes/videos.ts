import { Router, Request, Response } from 'express';
import { fileStorage } from '@/utils/fileStorage';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * GET /api/videos/:storyId/:segmentId
 * Stream video file for a specific segment
 */
router.get('/:storyId/:segmentId', async (req: Request, res: Response) => {
  try {
    const { storyId, segmentId } = req.params;
    
    // Load story to verify it exists
    const story = await fileStorage.loadStoryData(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Find the segment
    const segment = story.segments.find(s => s.id === parseInt(segmentId));
    if (!segment || !segment.videoPath) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if video file exists
    const videoExists = await fileStorage.fileExists(segment.videoPath);
    if (!videoExists) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    // Get file stats for streaming
    const stat = fs.statSync(segment.videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(segment.videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range request, send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(200, head);
      fs.createReadStream(segment.videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({
      error: 'Failed to stream video',
    });
  }
});

/**
 * GET /api/videos/:storyId/:segmentId/download
 * Download video file
 */
router.get('/:storyId/:segmentId/download', async (req: Request, res: Response) => {
  try {
    const { storyId, segmentId } = req.params;
    
    const story = await fileStorage.loadStoryData(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const segment = story.segments.find(s => s.id === parseInt(segmentId));
    if (!segment || !segment.videoPath) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const filename = `${story.originalFilename.replace(/\.[^/.]+$/, '')}-segment-${segmentId}.mp4`;
    
    res.download(segment.videoPath, filename);
  } catch (error) {
    console.error('Error downloading video:', error);
    res.status(500).json({
      error: 'Failed to download video',
    });
  }
});

export default router;


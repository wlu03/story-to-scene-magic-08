import fs from 'fs/promises';
import path from 'path';
import { config } from '@/config';
import { StoryData } from '@/types';

export class FileStorageService {
  /**
   * Initialize storage directories
   */
  async initializeStorage(): Promise<void> {
    const directories = [
      config.storage.dataDir,
      config.storage.uploadDir,
      config.storage.storiesDir,
      config.storage.videosDir,
      config.storage.imagesDir,
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }

    console.log('Storage directories initialized');
  }

  /**
   * Save story data to JSON file
   */
  async saveStoryData(storyId: string, data: StoryData): Promise<void> {
    const filePath = path.join(config.storage.storiesDir, `${storyId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Load story data from JSON file
   */
  async loadStoryData(storyId: string): Promise<StoryData | null> {
    try {
      const filePath = path.join(config.storage.storiesDir, `${storyId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all stories
   */
  async listStories(): Promise<StoryData[]> {
    try {
      const files = await fs.readdir(config.storage.storiesDir);
      const stories: StoryData[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const storyId = file.replace('.json', '');
          const story = await this.loadStoryData(storyId);
          if (story) {
            stories.push(story);
          }
        }
      }

      return stories.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    } catch (error) {
      console.error('Error listing stories:', error);
      return [];
    }
  }

  /**
   * Delete story and associated files
   */
  async deleteStory(storyId: string): Promise<void> {
    const storyPath = path.join(config.storage.storiesDir, `${storyId}.json`);
    await fs.unlink(storyPath).catch(() => {});
    
    // Delete associated video files
    const videoDir = path.join(config.storage.videosDir, storyId);
    await fs.rm(videoDir, { recursive: true, force: true }).catch(() => {});
    
    // Delete associated image files
    const imageDir = path.join(config.storage.imagesDir, storyId);
    await fs.rm(imageDir, { recursive: true, force: true }).catch(() => {});
  }

  /**
   * Get video file path for a segment
   */
  getVideoPath(storyId: string, segmentId: number): string {
    return path.join(config.storage.videosDir, storyId, `segment-${segmentId}.mp4`);
  }

  /**
   * Get image file path for a segment
   */
  getImagePath(storyId: string, segmentId: number): string {
    return path.join(config.storage.imagesDir, storyId, `segment-${segmentId}.png`);
  }

  /**
   * Ensure directory exists for story assets
   */
  async ensureStoryDirectories(storyId: string): Promise<void> {
    const videoDir = path.join(config.storage.videosDir, storyId);
    const imageDir = path.join(config.storage.imagesDir, storyId);
    
    await fs.mkdir(videoDir, { recursive: true });
    await fs.mkdir(imageDir, { recursive: true });
  }

  /**
   * Save video file
   */
  async saveVideo(storyId: string, segmentId: number, buffer: Buffer): Promise<string> {
    await this.ensureStoryDirectories(storyId);
    const videoPath = this.getVideoPath(storyId, segmentId);
    await fs.writeFile(videoPath, buffer);
    return videoPath;
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const fileStorage = new FileStorageService();


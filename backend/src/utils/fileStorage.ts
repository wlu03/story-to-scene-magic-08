import fs from 'fs/promises';
import path from 'path';
import { config } from '@/config';
import { StoryData } from '@/types';

export class FileStorageService {
  /**
   * Sanitize story name for folder creation
   */
  sanitizeStoryName(filename: string): string {
    return filename
      .replace(/\.[^/.]+$/, '') // Remove file extension
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  /**
   * Sanitize section name for folder creation
   */
  sanitizeSectionName(sectionName: string): string {
    return sectionName
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase()
      .substring(0, 30); // Limit length
  }

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
  async deleteStory(storyId: string, storyName?: string): Promise<void> {
    const storyPath = path.join(config.storage.storiesDir, `${storyId}.json`);
    await fs.unlink(storyPath).catch(() => {});
    
    // Delete new folder structure (story-name folder)
    if (storyName) {
      const storyDir = this.getStoryDirectory(storyName);
      await fs.rm(storyDir, { recursive: true, force: true }).catch(() => {});
    }
    
    // Delete legacy video files
    const videoDir = path.join(config.storage.videosDir, storyId);
    await fs.rm(videoDir, { recursive: true, force: true }).catch(() => {});
    
    // Delete legacy image files
    const imageDir = path.join(config.storage.imagesDir, storyId);
    await fs.rm(imageDir, { recursive: true, force: true }).catch(() => {});
  }

  /**
   * Get story directory path (story-name folder)
   */
  getStoryDirectory(storyName: string): string {
    return path.join(config.storage.dataDir, storyName);
  }

  /**
   * Get section directory path (story-name/section-name folder)
   */
  getSectionDirectory(storyName: string, sectionName: string): string {
    return path.join(this.getStoryDirectory(storyName), sectionName);
  }

  /**
   * Get video file path for a section
   */
  getVideoPath(storyName: string, sectionName: string): string {
    return path.join(this.getSectionDirectory(storyName, sectionName), 'video.mp4');
  }

  /**
   * Get audio file path for a section
   */
  getAudioPath(storyName: string, sectionName: string): string {
    return path.join(this.getSectionDirectory(storyName, sectionName), 'audio.mp3');
  }

  /**
   * Get background image file path for a section
   */
  getBackgroundImagePath(storyName: string, sectionName: string): string {
    return path.join(this.getSectionDirectory(storyName, sectionName), 'background.png');
  }

  /**
   * Get script file path for a section
   */
  getScriptPath(storyName: string, sectionName: string): string {
    return path.join(this.getSectionDirectory(storyName, sectionName), 'script.txt');
  }

  /**
   * Get narration script file path for a section
   */
  getNarrationScriptPath(storyName: string, sectionName: string): string {
    return path.join(this.getSectionDirectory(storyName, sectionName), 'narration-script.txt');
  }

  /**
   * Ensure directory exists for story and section assets
   */
  async ensureStoryDirectories(storyName: string, sectionName?: string): Promise<void> {
    const storyDir = this.getStoryDirectory(storyName);
    await fs.mkdir(storyDir, { recursive: true });
    
    if (sectionName) {
      const sectionDir = this.getSectionDirectory(storyName, sectionName);
      await fs.mkdir(sectionDir, { recursive: true });
    }
  }

  /**
   * Save video file for a section
   */
  async saveVideo(storyName: string, sectionName: string, buffer: Buffer): Promise<string> {
    await this.ensureStoryDirectories(storyName, sectionName);
    const videoPath = this.getVideoPath(storyName, sectionName);
    await fs.writeFile(videoPath, buffer);
    return videoPath;
  }

  /**
   * Save audio file for a section
   */
  async saveAudio(storyName: string, sectionName: string, buffer: Buffer): Promise<string> {
    await this.ensureStoryDirectories(storyName, sectionName);
    const audioPath = this.getAudioPath(storyName, sectionName);
    await fs.writeFile(audioPath, buffer);
    return audioPath;
  }

  /**
   * Save background image for a section
   */
  async saveBackgroundImage(storyName: string, sectionName: string, buffer: Buffer): Promise<string> {
    await this.ensureStoryDirectories(storyName, sectionName);
    const imagePath = this.getBackgroundImagePath(storyName, sectionName);
    await fs.writeFile(imagePath, buffer);
    return imagePath;
  }

  /**
   * Save script file for a section
   */
  async saveScript(storyName: string, sectionName: string, scriptContent: string): Promise<string> {
    await this.ensureStoryDirectories(storyName, sectionName);
    const scriptPath = this.getScriptPath(storyName, sectionName);
    await fs.writeFile(scriptPath, scriptContent, 'utf-8');
    return scriptPath;
  }

  /**
   * Save narration script file for a section
   */
  async saveNarrationScript(storyName: string, sectionName: string, narrationScriptContent: string): Promise<string> {
    await this.ensureStoryDirectories(storyName, sectionName);
    const narrationScriptPath = this.getNarrationScriptPath(storyName, sectionName);
    await fs.writeFile(narrationScriptPath, narrationScriptContent, 'utf-8');
    return narrationScriptPath;
  }

  // Legacy methods for backward compatibility
  getVideoPathLegacy(storyId: string, segmentId: number): string {
    return path.join(config.storage.videosDir, storyId, `segment-${segmentId}.mp4`);
  }

  getImagePathLegacy(storyId: string, segmentId: number): string {
    return path.join(config.storage.imagesDir, storyId, `segment-${segmentId}.png`);
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


import { fileStorage } from '@/utils/fileStorage';
import { storyAnalyzer } from './storyAnalyzer';
import { geminiVeo } from './geminiVeo';
import { StoryData, StorySegment } from '@/types';

export class StoryProcessorService {
  /**
   * Process a story: analyze and generate videos
   */
  async processStory(storyId: string): Promise<void> {
    try {
      // Load story data
      const story = await fileStorage.loadStoryData(storyId);
      if (!story || !story.textContent) {
        throw new Error('Story not found or has no content');
      }

      // Update status to analyzing
      await this.updateStoryStatus(storyId, {
        status: 'analyzing',
        progress: 10,
        currentStep: 'Analyzing story structure...',
      });

      // Analyze story and create segments
      const segments = await storyAnalyzer.analyzeStory(story.textContent);
      
      // Update story with segments
      story.segments = segments.map(seg => ({
        ...seg,
        status: 'pending' as const,
      }));
      await fileStorage.saveStoryData(storyId, story);

      // Update status to generating
      await this.updateStoryStatus(storyId, {
        status: 'generating',
        progress: 30,
        currentStep: 'Generating videos...',
      });

      // Generate videos for each segment
      const totalSegments = story.segments.length;
      for (let i = 0; i < story.segments.length; i++) {
        const segment = story.segments[i];
        const progress = 30 + ((i / totalSegments) * 60);

        await this.updateStoryStatus(storyId, {
          status: 'generating',
          progress: Math.round(progress),
          currentStep: `Generating video ${i + 1} of ${totalSegments}...`,
        });

        // Update segment status
        segment.status = 'generating';
        await fileStorage.saveStoryData(storyId, story);

        // Generate video using Veo 3
        const videoResult = await geminiVeo.generateVideo({
          prompt: segment.imagePrompt || segment.sceneDescription,
          duration: segment.duration,
          aspectRatio: '16:9',
        });

        if (videoResult.success && videoResult.videoPath) {
          segment.videoPath = videoResult.videoPath;
          segment.videoUrl = `/api/videos/${storyId}/${segment.id}`;
          segment.status = 'completed';
        } else {
          segment.status = 'failed';
          segment.error = videoResult.error || 'Unknown error';
        }

        await fileStorage.saveStoryData(storyId, story);
      }

      // Mark as completed
      await this.updateStoryStatus(storyId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Processing complete!',
      });

    } catch (error) {
      console.error(`Error processing story ${storyId}:`, error);
      
      await this.updateStoryStatus(storyId, {
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update story status
   */
  private async updateStoryStatus(
    storyId: string,
    updates: Partial<StoryData>
  ): Promise<void> {
    const story = await fileStorage.loadStoryData(storyId);
    if (!story) return;

    Object.assign(story, updates);
    await fileStorage.saveStoryData(storyId, story);
  }

  /**
   * Regenerate a specific segment
   */
  async regenerateSegment(storyId: string, segmentId: number): Promise<void> {
    const story = await fileStorage.loadStoryData(storyId);
    if (!story) {
      throw new Error('Story not found');
    }

    const segment = story.segments.find(s => s.id === segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    segment.status = 'generating';
    await fileStorage.saveStoryData(storyId, story);

    try {
      const videoResult = await geminiVeo.generateVideo({
        prompt: segment.imagePrompt || segment.sceneDescription,
        duration: segment.duration,
        aspectRatio: '16:9',
      });

      if (videoResult.success && videoResult.videoPath) {
        segment.videoPath = videoResult.videoPath;
        segment.videoUrl = `/api/videos/${storyId}/${segment.id}`;
        segment.status = 'completed';
        segment.error = undefined;
      } else {
        segment.status = 'failed';
        segment.error = videoResult.error || 'Unknown error';
      }
    } catch (error) {
      segment.status = 'failed';
      segment.error = error instanceof Error ? error.message : 'Unknown error';
    }

    await fileStorage.saveStoryData(storyId, story);
  }
}

export const storyProcessor = new StoryProcessorService();


import { GoogleGenAI } from '@google/genai';
import { config } from '@/config';
import { GeminiVeoRequest, GeminiVeoResponse } from '@/types';
import { fileStorage } from '@/utils/fileStorage';
import path from 'path';

export class GeminiVeoService {
  private ai: any;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: config.google.apiKey,
    });
  }

  /**
   * Generate video using Gemini Veo 3
   */
  async generateVideo(
    request: GeminiVeoRequest,
    storyId: string,
    segmentId: number
  ): Promise<GeminiVeoResponse> {
    try {
      console.log(`\n🎬 Starting Veo 3 video generation for segment ${segmentId}...`);
      console.log(`Model: ${request.model || 'veo-3.0-generate-001'}`);
      console.log(`Prompt: ${request.prompt.substring(0, 100)}...`);

      // Prepare video generation parameters
      const params: any = {
        model: request.model || 'veo-3.0-generate-001',
        prompt: request.prompt,
      };

      // Add optional parameters
      if (request.duration) {
        params.duration = request.duration;
      }
      if (request.aspectRatio) {
        params.aspectRatio = request.aspectRatio;
      }
      if (request.resolution) {
        params.resolution = request.resolution;
      }
      if (request.negativePrompt) {
        params.negativePrompt = request.negativePrompt;
      }
      if (request.personGeneration) {
        params.personGeneration = request.personGeneration;
      }
      if (request.seed) {
        params.seed = request.seed;
      }
      if (request.sampleCount) {
        params.sampleCount = request.sampleCount;
      }
      if (request.image) {
        params.image = request.image;
      }

      // Start video generation
      let operation = await this.ai.models.generateVideos(params);
      
      console.log('📹 Video generation started, operation ID:', operation.name);

      // Poll the operation status until the video is ready
      let pollCount = 0;
      const maxPolls = 60; // 10 minutes max (10 seconds * 60)
      
      while (!operation.done) {
        pollCount++;
        
        if (pollCount > maxPolls) {
          throw new Error('Video generation timeout after 10 minutes');
        }
        
        console.log(`⏳ Waiting for video generation... (${pollCount * 10}s elapsed)`);
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        // Get updated operation status
        operation = await this.ai.operations.getVideosOperation({
          operation: operation,
        });
      }

      // Check if generation was successful
      if (!operation.response || !operation.response.generatedVideos || 
          operation.response.generatedVideos.length === 0) {
        throw new Error('Video generation completed but no video was returned');
      }

      console.log('✅ Video generation completed!');

      // Download the generated video
      const videoFile = operation.response.generatedVideos[0].video;
      const videoPath = fileStorage.getVideoPath(storyId, segmentId);
      
      // Ensure directory exists
      await fileStorage.ensureStoryDirectories(storyId);
      
      console.log(`💾 Downloading video to: ${videoPath}`);
      
      await this.ai.files.download({
        file: videoFile,
        downloadPath: videoPath,
      });

      console.log('✅ Video downloaded successfully!');

      return {
        success: true,
        videoPath: videoPath,
        videoUrl: `/api/videos/${storyId}/${segmentId}`,
      };

    } catch (error) {
      console.error('❌ Error generating video with Veo 3:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate video with retry logic
   */
  async generateVideoWithRetry(
    request: GeminiVeoRequest,
    storyId: string,
    segmentId: number,
    maxRetries: number = 3
  ): Promise<GeminiVeoResponse> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`\n🔄 Attempt ${attempt} of ${maxRetries}...`);
      
      const result = await this.generateVideo(request, storyId, segmentId);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error || 'Unknown error';
      
      if (attempt < maxRetries) {
        const waitTime = attempt * 5000; // Exponential backoff: 5s, 10s, 15s
        console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    return {
      success: false,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
    };
  }

  /**
   * Check if Veo 3 is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Simple test to verify the API is configured correctly
      return !!this.ai && !!config.google.apiKey;
    } catch (error) {
      console.error('Veo 3 not available:', error);
      return false;
    }
  }

  /**
   * Get video generation capabilities
   */
  getCapabilities() {
    return {
      models: ['veo-3.0-generate-001', 'veo-3.0-fast-generate-001'],
      aspectRatios: ['16:9', '9:16', '1:1'],
      resolutions: ['720p', '1080p'],
      maxDuration: 60, // seconds
      supportedFeatures: [
        'text-to-video',
        'image-to-video',
        'negative-prompts',
        'seed-control',
        'person-generation-control',
      ],
    };
  }

  /**
   * Validate video generation request
   */
  validateRequest(request: GeminiVeoRequest): { valid: boolean; error?: string } {
    if (!request.prompt || request.prompt.trim().length === 0) {
      return { valid: false, error: 'Prompt is required' };
    }

    if (request.prompt.length > 2000) {
      return { valid: false, error: 'Prompt must be less than 2000 characters' };
    }

    if (request.duration && (request.duration < 1 || request.duration > 60)) {
      return { valid: false, error: 'Duration must be between 1 and 60 seconds' };
    }

    return { valid: true };
  }
}

export const geminiVeo = new GeminiVeoService();

import { fileStorage } from '@/utils/fileStorage';
import { storyAnalyzer } from './storyAnalyzer';
import { styleExtractor } from './styleExtractor';
import { geminiVeo } from './geminiVeo';
import { imageGenerator } from './imageGenerator';
import { config } from '@/config';
import { StoryData, StorySegment } from '@/types';

export class StoryProcessorService {
  /**
   * Process a story: extract style, analyze, and generate videos
   */
  async processStory(storyId: string): Promise<void> {
    try {
      // Load story data
      const story = await fileStorage.loadStoryData(storyId);
      if (!story || !story.textContent) {
        throw new Error('Story not found or has no content');
      }

      console.log(`\n🎬 Starting processing for story: ${story.originalFilename}`);

      // Step 1: Extract style information (characters, setting, visual style)
      await this.updateStoryStatus(storyId, {
        status: 'extracting_style',
        progress: 10,
        currentStep: 'Extracting characters, setting, and style...',
      });

      console.log('📝 Extracting style information...');
      const styleInfo = await styleExtractor.extractStyleInfo(story.textContent);
      story.styleInfo = styleInfo;
      await fileStorage.saveStoryData(storyId, story);
      
      console.log('✓ Style info extracted:', {
        characters: styleInfo.characters.length,
        setting: styleInfo.setting.location,
        style: styleInfo.visualStyle.artStyle,
      });

      // Step 2: Generate reference image for style consistency
      await this.updateStoryStatus(storyId, {
        status: 'generating_reference_image',
        progress: 20,
        currentStep: 'Generating reference image for style consistency...',
      });

      console.log('🎨 Generating reference image...');
      try {
        const referenceImage = await imageGenerator.generateReferenceImage(styleInfo, storyId);
        story.referenceImagePath = referenceImage.imagePath;
        story.referenceImageUrl = referenceImage.imageUrl;
        await fileStorage.saveStoryData(storyId, story);
        
        console.log('✓ Reference image generated');
      } catch (error) {
        console.warn('⚠️  Reference image generation failed, continuing without it:', error);
        // Continue without reference image
      }

      // Step 3: Analyze story and create segments with style context
      await this.updateStoryStatus(storyId, {
        status: 'generating_segments',
        progress: 30,
        currentStep: 'Analyzing story and creating segments...',
      });

      console.log('🎭 Analyzing story and creating segments...');
      const segments = await storyAnalyzer.analyzeStory(story.textContent, styleInfo);
      
      // Update story with segments
      story.segments = segments.map(seg => ({
        ...seg,
        status: 'pending' as const,
      }));
      await fileStorage.saveStoryData(storyId, story);
      
      console.log(`✓ Created ${story.segments.length} segments`);

      // Step 4: Generate videos for each segment using Gemini Veo 3
      await this.updateStoryStatus(storyId, {
        status: 'generating_videos',
        progress: 45,
        currentStep: 'Generating videos with Gemini Veo 3...',
      });

      const totalSegments = story.segments.length;
      console.log(`\n🎥 Generating ${totalSegments} videos...`);
      
      // Prepare reference image for video generation
      let referenceImageBase64: string | undefined;
      if (story.referenceImagePath) {
        try {
          referenceImageBase64 = await imageGenerator.imageToBase64(story.referenceImagePath);
          console.log('✓ Reference image loaded for video context');
        } catch (error) {
          console.warn('⚠️  Could not load reference image:', error);
        }
      }
      
      for (let i = 0; i < story.segments.length; i++) {
        const segment = story.segments[i];
        const progress = 45 + ((i / totalSegments) * 50);

        await this.updateStoryStatus(storyId, {
          status: 'generating_videos',
          progress: Math.round(progress),
          currentStep: `Generating video ${i + 1} of ${totalSegments}: ${segment.caption}`,
        });

        console.log(`\n📹 Segment ${i + 1}/${totalSegments}: ${segment.caption}`);
        console.log(`Prompt: ${segment.imagePrompt?.substring(0, 100)}...`);

        // Update segment status
        segment.status = 'generating';
        await fileStorage.saveStoryData(storyId, story);

        // Build enhanced prompt with style context
        const enhancedPrompt = this.buildPromptWithStyleContext(
          segment,
          story.styleInfo
        );

        // Validate prompt before generation
        const veoRequest: any = {
          prompt: enhancedPrompt,
          duration: segment.duration || 10,
          aspectRatio: '16:9' as const,
          model: 'veo-3.0-generate-001' as const,
        };

        // Add reference image if available (image-to-video)
        if (referenceImageBase64) {
          veoRequest.image = {
            imageBytes: referenceImageBase64,
            mimeType: 'image/png',
          };
          console.log('🎨 Using reference image for video context');
        }

        const validation = geminiVeo.validateRequest(veoRequest);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        console.log(`📝 Enhanced prompt with style context (${enhancedPrompt.length} chars)`);

        // Generate video using Veo 3 with retry logic
        const videoResult = await geminiVeo.generateVideoWithRetry(
          veoRequest,
          storyId,
          segment.id,
          config.veo.maxRetries
        );

        if (videoResult.success && videoResult.videoPath) {
          segment.videoPath = videoResult.videoPath;
          segment.videoUrl = `/api/videos/${storyId}/${segment.id}`;
          segment.status = 'completed';
          console.log(`✓ Video generated successfully: ${segment.videoPath}`);
        } else {
          segment.status = 'failed';
          segment.error = videoResult.error || 'Unknown error';
          console.error(`✗ Video generation failed: ${segment.error}`);
        }

        await fileStorage.saveStoryData(storyId, story);
      }

      // Step 5: Mark as completed
      await this.updateStoryStatus(storyId, {
        status: 'completed',
        progress: 100,
        currentStep: 'All videos generated successfully!',
      });

      console.log(`\n✓ Processing complete for story: ${story.originalFilename}`);
      console.log(`Total segments: ${story.segments.length}`);
      console.log(`Successful: ${story.segments.filter(s => s.status === 'completed').length}`);
      console.log(`Failed: ${story.segments.filter(s => s.status === 'failed').length}\n`);

    } catch (error) {
      console.error(`\n✗ Error processing story ${storyId}:`, error);
      
      await this.updateStoryStatus(storyId, {
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Build enhanced prompt with style context
   */
  private buildPromptWithStyleContext(
    segment: StorySegment,
    styleInfo?: import('@/types').StoryStyle
  ): string {
    let prompt = segment.imagePrompt || segment.sceneDescription;

    // If styleInfo exists, prepend it as context
    if (styleInfo) {
      let styleContext = '\n\n[STYLE CONTEXT FOR CONSISTENCY]\n';

      // Add character information
      if (styleInfo.characters && styleInfo.characters.length > 0) {
        styleContext += 'Characters:\n';
        styleInfo.characters.forEach(char => {
          styleContext += `- ${char.name}: ${char.physicalTraits}\n`;
        });
        styleContext += '\n';
      }

      // Add setting information
      if (styleInfo.setting) {
        styleContext += `Setting: ${styleInfo.setting.location}\n`;
        styleContext += `Time Period: ${styleInfo.setting.timeperiod}\n`;
        styleContext += `Atmosphere: ${styleInfo.setting.atmosphere}\n\n`;
      }

      // Add visual style
      if (styleInfo.visualStyle) {
        styleContext += `Art Style: ${styleInfo.visualStyle.artStyle}\n`;
        styleContext += `Color Palette: ${styleInfo.visualStyle.colorPalette}\n`;
        styleContext += `Cinematography: ${styleInfo.visualStyle.cinematography}\n`;
      }

      styleContext += '\n[SCENE TO GENERATE]\n';

      prompt = styleContext + prompt;
    }

    return prompt;
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
   * Regenerate a specific segment with optional new prompt
   */
  async regenerateSegment(
    storyId: string, 
    segmentId: number,
    newPrompt?: string
  ): Promise<void> {
    const story = await fileStorage.loadStoryData(storyId);
    if (!story) {
      throw new Error('Story not found');
    }

    const segment = story.segments.find(s => s.id === segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    console.log(`\n🔄 Regenerating segment ${segmentId}: ${segment.caption}`);

    // Update prompt if provided
    if (newPrompt) {
      segment.imagePrompt = newPrompt;
    }

    segment.status = 'generating';
    await fileStorage.saveStoryData(storyId, story);

    try {
      // Build enhanced prompt with style context
      const enhancedPrompt = this.buildPromptWithStyleContext(
        segment,
        story.styleInfo
      );

      const veoRequest: any = {
        prompt: enhancedPrompt,
        duration: segment.duration || 10,
        aspectRatio: '16:9' as const,
        model: 'veo-3.0-generate-001' as const,
      };

      // Add reference image if available
      if (story.referenceImagePath) {
        try {
          const referenceImageBase64 = await imageGenerator.imageToBase64(story.referenceImagePath);
          veoRequest.image = {
            imageBytes: referenceImageBase64,
            mimeType: 'image/png',
          };
          console.log('🎨 Using reference image for regeneration');
        } catch (error) {
          console.warn('⚠️  Could not load reference image for regeneration');
        }
      }

      console.log(`📝 Using enhanced prompt with style context (${enhancedPrompt.length} chars)`);

      const videoResult = await geminiVeo.generateVideoWithRetry(
        veoRequest,
        storyId,
        segment.id,
        config.veo.maxRetries
      );

      if (videoResult.success && videoResult.videoPath) {
        segment.videoPath = videoResult.videoPath;
        segment.videoUrl = `/api/videos/${storyId}/${segment.id}`;
        segment.status = 'completed';
        segment.error = undefined;
        console.log(`✓ Segment regenerated successfully`);
      } else {
        segment.status = 'failed';
        segment.error = videoResult.error || 'Unknown error';
        console.error(`✗ Regeneration failed: ${segment.error}`);
      }
    } catch (error) {
      segment.status = 'failed';
      segment.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`✗ Regeneration error: ${segment.error}`);
    }

    await fileStorage.saveStoryData(storyId, story);
  }
}

export const storyProcessor = new StoryProcessorService();


import { fileStorage } from '@/utils/fileStorage';
import { storyAnalyzer } from './storyAnalyzer';
import { styleExtractor } from './styleExtractor';
import { imageGenerator } from './imageGenerator';
import { backgroundImageService } from './backgroundImageService';
import { audioService } from './audioService';
import { videoService } from './videoService';
import { config } from '@/config';
import { StoryData, StorySection } from '@/types';

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

      // Step 2: Generate reference image for style consistency (optional)
      if (config.features.enableReferenceImages) {
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
      } else {
        console.log('ℹ️  Reference image generation disabled (requires Vertex AI)');
      }

      // Step 3: Analyze story and create sections with scripts
      await this.updateStoryStatus(storyId, {
        status: 'generating_sections',
        progress: 30,
        currentStep: 'Analyzing story and creating sections...',
      });

      // Generate clean story name for folder creation
      const storyName = fileStorage.sanitizeStoryName(story.originalFilename);
      story.storyName = storyName;
      
      console.log('🎭 Analyzing story and creating sections...');
      const sections = await storyAnalyzer.analyzeStory(story.textContent, styleInfo, storyName);
      
      // Update story with sections, save scripts, and generate background images
      story.sections = await Promise.all(sections.map(async (section) => {
        const sectionName = fileStorage.sanitizeSectionName(section.sectionName);

        // Add status property for compatibility
        const sectionWithStatus = { ...section, status: 'pending' as const };

        // Save script file
        const scriptPath = await fileStorage.saveScript(storyName, sectionName, section.script);

        // Generate background image and save path
        const backgroundImagePath = await backgroundImageService.generateBackgroundImage(
          sectionWithStatus,
          storyName,
          styleInfo
        );

        return {
          ...sectionWithStatus,
          scriptPath,
          backgroundImagePath,
        };
      }));
      
      // Keep legacy segments for backward compatibility
      story.segments = story.sections.map(section => ({
        ...section,
        status: 'pending' as const,
      }));
      
      await fileStorage.saveStoryData(storyId, story);
      
      console.log(`✓ Created ${story.sections.length} sections with scripts`);

      // Step 4: Generate audio for all sections
      await this.updateStoryStatus(storyId, {
        status: 'generating_audio',
        progress: 60,
        currentStep: 'Generating audio for all sections...',
      });

      console.log('🎵 Generating audio for all sections...');
      try {
        const storyName = story.storyName || fileStorage.sanitizeStoryName(story.originalFilename);
        await audioService.processSectionsForAudio(story.sections, storyName);
        
        // Update sections with audio paths
        for (let i = 0; i < story.sections.length; i++) {
          const section = story.sections[i];
          if (section.audioPath) {
            // Audio path should be set by the audioService
            console.log(`✓ Audio generated for section: ${section.sectionName}`);
          }
        }
        
        await fileStorage.saveStoryData(storyId, story);
        console.log('✓ Audio generation complete for all sections');
      } catch (error) {
        console.warn('⚠️  Audio generation failed, continuing without it:', error);
        // Continue without audio
      }

      // Step 5: Mark as completed
      await this.updateStoryStatus(storyId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Story processing complete! Audio generated for all sections.',
      });

      console.log(`\n✓ Story processing complete: ${story.originalFilename}`);
      console.log(`✓ Created ${story.sections.length} sections with scripts`);
      console.log(`📁 Story folder: ${storyName}`);
      console.log(`📝 Scripts saved in: data/${storyName}/`);

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
<<<<<<< HEAD
   * Generate background image for a section
=======
   * Clean up old sections before creating new ones
   */
  private async cleanupOldSections(storyName: string): Promise<void> {
    try {
      const storyDir = fileStorage.getStoryDirectory(storyName);
      const fs = await import('fs/promises');
      
      // Check if directory exists
      try {
        await fs.access(storyDir);
      } catch {
        // Directory doesn't exist, nothing to clean up
        return;
      }
      
      // Remove all existing sections
      const entries = await fs.readdir(storyDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sectionPath = `${storyDir}/${entry.name}`;
          await fs.rm(sectionPath, { recursive: true, force: true });
          console.log(`🗑️  Cleaned up old section: ${entry.name}`);
        }
      }
    } catch (error) {
      console.warn('⚠️  Failed to clean up old sections:', error);
      // Don't fail the entire process if cleanup fails
    }
  }

  /**
   * Generate background image for a section (COMMENTED OUT - API KEY LIMIT)
>>>>>>> effdf21 (Add automatic audio generation to story processor)
   */
  // async generateBackgroundImage(storyId: string, sectionId: number): Promise<void> {
  //   const story = await fileStorage.loadStoryData(storyId);
  //   if (!story || !story.styleInfo) {
  //     throw new Error('Story not found or missing style info');
  //   }

  //   const section = story.sections.find(s => s.id === sectionId);
  //   if (!section) {
  //     throw new Error('Section not found');
  //   }

  //   console.log(`🎨 Generating background image for section: ${section.sectionName}`);
    
<<<<<<< HEAD
    try {
      const storyName = story.storyName || fileStorage.sanitizeStoryName(story.originalFilename);
      const backgroundImagePath = await backgroundImageService.generateBackgroundImage(
        section, 
        storyName, 
        story.styleInfo
      );
=======
  //   try {
  //     const storyName = story.storyName || fileStorage.sanitizeStoryName(story.originalFilename);
  //     const backgroundImagePath = await backgroundImageService.generateBackgroundImageForSection(
  //       story.textContent!, // full story
  //       section,
  //       storyName,
  //       story.styleInfo
  //     );
>>>>>>> effdf21 (Add automatic audio generation to story processor)
      
  //     section.backgroundImagePath = backgroundImagePath;
  //     await fileStorage.saveStoryData(storyId, story);
      
  //     console.log(`✓ Background image generated: ${backgroundImagePath}`);
  //   } catch (error) {
  //     console.error(`✗ Background image generation failed: ${error}`);
  //     throw error;
  //   }
  // }

  /**
   * Generate audio for a section
   */
  async generateAudio(storyId: string, sectionId: number): Promise<void> {
    const story = await fileStorage.loadStoryData(storyId);
    if (!story) {
      throw new Error('Story not found');
    }

    const section = story.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    console.log(`🎵 Generating audio for section: ${section.sectionName}`);
    
    try {
      const storyName = story.storyName || fileStorage.sanitizeStoryName(story.originalFilename);
      const audioPath = await audioService.generateAudio(section, storyName);
      
      // Update section with audio path and narration script path
      section.audioPath = audioPath;
      const sectionName = fileStorage.sanitizeSectionName(section.sectionName);
      section.narrationScriptPath = fileStorage.getNarrationScriptPath(storyName, sectionName);
      
      await fileStorage.saveStoryData(storyId, story);
      
      console.log(`✓ Audio generated: ${audioPath}`);
    } catch (error) {
      console.error(`✗ Audio generation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Generate video for a section
   */
  async generateVideo(storyId: string, sectionId: number): Promise<void> {
    const story = await fileStorage.loadStoryData(storyId);
    if (!story || !story.styleInfo) {
      throw new Error('Story not found or missing style info');
    }

    const section = story.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    console.log(`🎬 Generating video for section: ${section.sectionName}`);
    
    try {
      const storyName = story.storyName || fileStorage.sanitizeStoryName(story.originalFilename);
      const videoPath = await videoService.generateVideo(section, storyName, story.styleInfo);
      
      section.videoPath = videoPath;
      section.status = 'completed';
      await fileStorage.saveStoryData(storyId, story);
      
      console.log(`✓ Video generated: ${videoPath}`);
    } catch (error) {
      section.status = 'failed';
      section.error = error instanceof Error ? error.message : 'Unknown error';
      await fileStorage.saveStoryData(storyId, story);
      console.error(`✗ Video generation failed: ${error}`);
      throw error;
    }
  }

  /**
   * Generate videos for all sections in a story
   */
  async generateAllVideos(storyId: string): Promise<void> {
    const story = await fileStorage.loadStoryData(storyId);
    if (!story || !story.styleInfo) {
      throw new Error('Story not found or missing style info');
    }

    console.log(`\n🎬 Starting video generation for all ${story.sections.length} sections...`);
    console.log(`Story: ${story.originalFilename}`);
    console.log(`Story ID: ${storyId}\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < story.sections.length; i++) {
      const section = story.sections[i];
      
      // Skip if already completed
      if (section.status === 'completed' && section.videoPath) {
        console.log(`⏭️  Section ${section.id}/${story.sections.length}: ${section.sectionName} - Already completed`);
        successCount++;
        continue;
      }

      console.log(`\n📹 Section ${section.id}/${story.sections.length}: ${section.sectionName}`);
      
      try {
        await this.generateVideo(storyId, section.id);
        successCount++;
        console.log(`✅ Section ${section.id} completed (${successCount}/${story.sections.length} done)`);
      } catch (error) {
        failCount++;
        console.error(`❌ Section ${section.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue to next section even if one fails
      }

      // Add a small delay between sections to avoid rate limiting
      if (i < story.sections.length - 1) {
        console.log('⏳ Waiting 2s before next section...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n✅ Video generation complete!`);
    console.log(`📊 Results: ${successCount} successful, ${failCount} failed, ${story.sections.length} total`);
  }
}

export const storyProcessor = new StoryProcessorService();


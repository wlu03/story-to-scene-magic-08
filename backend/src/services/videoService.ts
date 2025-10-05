import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config';
import { fileStorage } from '@/utils/fileStorage';
import { geminiVeo } from './geminiVeo';
import { StorySection, StoryStyle } from '@/types';

export class VideoService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.google.apiKey);
  }

  /**
   * Generate video for a section using Gemini Veo
   */
  async generateVideo(
    section: StorySection, 
    storyName: string, 
    styleInfo: StoryStyle
  ): Promise<string> {
    try {
      const sectionName = fileStorage.sanitizeSectionName(section.sectionName);
      
      // Generate video prompt based on scene description
      const videoPrompt = await this.generateVideoPrompt(section, styleInfo);
      
      console.log(`🎬 Generating video for section: ${section.sectionName}`);
      console.log(`Video prompt: ${videoPrompt.substring(0, 100)}...`);
      
      // Generate video using Gemini Veo
      const veoRequest = {
        prompt: videoPrompt,
        duration: section.duration || 8,
        aspectRatio: '16:9' as const,
        model: 'veo-3.0-generate-001' as const,
      };

      const videoResult = await geminiVeo.generateVideoWithRetry(
        veoRequest,
        storyName, // Using storyName as ID for now
        section.id,
        config.veo.maxRetries
      );

      if (videoResult.success && videoResult.videoPath) {
        // Copy video from legacy location to new folder structure
        const fs = await import('fs/promises');
        const videoData = await fs.readFile(videoResult.videoPath);
        const videoPath = await fileStorage.saveVideo(storyName, sectionName, videoData);
        console.log(`✓ Video generated successfully: ${videoPath}`);
        return videoPath;
      } else {
        throw new Error(videoResult.error || 'Video generation failed');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      throw new Error('Failed to generate video');
    }
  }

  /**
   * Generate video prompt based on section and style
   */
  private async generateVideoPrompt(section: StorySection, styleInfo: StoryStyle): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build style context
    const styleContext = this.buildStyleContext(styleInfo);
    
    const prompt = `
You are a children's story video generator. Create a detailed prompt for generating a video for this section.

STYLE CONTEXT:
${styleContext}

SECTION DETAILS:
- Scene: ${section.sceneDescription}
- Script: ${section.script}

Create a video generation prompt that:
- Is suitable for children's stories
- Shows the scene with sound effects only (NO narration/voice)
- Matches the visual style from the context
- Is engaging and colorful for young audiences
- Includes specific camera angles, lighting, and movement
- Is 8 seconds long

Return ONLY the video generation prompt, no additional text.
`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('Error generating video prompt:', error);
      return section.sceneDescription; // Fallback
    }
  }

  /**
   * Build style context string for prompt generation
   */
  private buildStyleContext(styleInfo: StoryStyle): string {
    let context = '';
    
    // Add character information
    if (styleInfo.characters.length > 0) {
      context += 'Characters:\n';
      styleInfo.characters.forEach(char => {
        context += `- ${char.name}: ${char.description}. Physical: ${char.physicalTraits}\n`;
      });
      context += '\n';
    }
    
    // Add setting information
    context += `Setting: ${styleInfo.setting.location}, ${styleInfo.setting.timeperiod}\n`;
    context += `Atmosphere: ${styleInfo.setting.atmosphere}\n\n`;
    
    // Add visual style
    context += `Visual Style: ${styleInfo.visualStyle.artStyle}\n`;
    context += `Color Palette: ${styleInfo.visualStyle.colorPalette}\n`;
    context += `Cinematography: ${styleInfo.visualStyle.cinematography}\n`;
    
    return context;
  }
}

export const videoService = new VideoService();

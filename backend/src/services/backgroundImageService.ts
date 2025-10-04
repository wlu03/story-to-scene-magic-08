import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config';
import { fileStorage } from '@/utils/fileStorage';
import { StorySection, StoryStyle } from '@/types';

export class BackgroundImageService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.google.apiKey);
  }

  /**
   * Generate background image for a section
   */
  async generateBackgroundImage(
    section: StorySection, 
    storyName: string, 
    styleInfo: StoryStyle
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build style context
    const styleContext = this.buildStyleContext(styleInfo);
    
    const prompt = `
You are a children's story background image generator. Create a detailed prompt for generating a background image for this section.

STYLE CONTEXT:
${styleContext}

SECTION DETAILS:
- Scene: ${section.sceneDescription}
- Script: ${section.script}

Create a background image prompt that:
- Is suitable for children's stories
- Complements the scene description
- Is appropriate for text overlay (not too busy)
- Matches the visual style from the context
- Is engaging and colorful for young audiences

Return ONLY the image generation prompt, no additional text.
`;

    try {
      const result = await model.generateContent(prompt);
      const backgroundImagePrompt = result.response.text().trim();
      
      // Generate the actual image using Gemini's image generation
      const imageModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const imageResult = await imageModel.generateContent([
        backgroundImagePrompt,
        "Generate a children's story background image based on this prompt."
      ]);
      
      // For now, we'll save the prompt and return a placeholder path
      // In a real implementation, you'd generate and save the actual image
      const sectionName = fileStorage.sanitizeSectionName(section.sectionName);
      const backgroundImagePath = fileStorage.getBackgroundImagePath(storyName, sectionName);
      
      // TODO: Implement actual image generation and saving
      console.log(`✓ Background image prompt generated for section: ${section.sectionName}`);
      console.log(`Prompt: ${backgroundImagePrompt}`);
      
      return backgroundImagePath;
    } catch (error) {
      console.error('Error generating background image:', error);
      throw new Error('Failed to generate background image');
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

export const backgroundImageService = new BackgroundImageService();

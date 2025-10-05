import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config';
import { fileStorage } from '@/utils/fileStorage';
import { StorySection, StoryStyle } from '@/types';
import fetch from 'node-fetch';
import fs from 'fs/promises';

export class BackgroundImageService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.google.apiKey);
  }

  /**
   * Generate background image for a section, given the full story and section script
   */
  async generateBackgroundImageForSection(
    storyText: string,
    section: StorySection,
    storyName: string,
    styleInfo: StoryStyle
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build style context
    const styleContext = this.buildStyleContext(styleInfo);
    
    const prompt = `
You are a children's story background image generator. Your task is to create a prompt for generating a background image for a specific section of a children's story. This image will be used as a backdrop for displaying the section's script as text, with words highlighted as they are narrated. The image should:
- Be visually engaging and colorful for children
- Clearly relate to the section's scene and script
- Not be too busy or cluttered
- **Leave a large, mostly empty or softly blurred area in the center of the image for text overlay. Do not place important characters or details in this area.**
- Ensure the center of the image has good contrast for white or black text
- Match the visual style and atmosphere of the story

STORY CONTEXT (for overall theme and style):
${storyText}

STYLE CONTEXT:
${styleContext}

SECTION DETAILS:
- Scene: ${section.sceneDescription}
- Script: ${section.script}

Return ONLY the image generation prompt, no additional text.
`;

    try {
      const result = await model.generateContent(prompt);
      const backgroundImagePrompt = result.response.text().trim();
      
      const sectionName = fileStorage.sanitizeSectionName(section.sectionName);
      const backgroundImagePath = fileStorage.getBackgroundImagePath(storyName, sectionName);

      // --- Stability AI Integration ---
      const stabilityApiKey = process.env.STABILITY_API_KEY || (config as any).stability?.apiKey;
      if (!stabilityApiKey) {
        throw new Error('Missing Stability API key');
      }
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stabilityApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [{ text: backgroundImagePrompt }],
          cfg_scale: 7,
          height: 768,
          width: 1344,
          samples: 1,
          steps: 30
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stability API error: ${errorText}`);
      }
      const data = (await response.json()) as { artifacts: { base64: string }[] };
      const base64Image = data.artifacts[0].base64;
      await fs.writeFile(backgroundImagePath, Buffer.from(base64Image, 'base64'));
      // --- End Stability AI Integration ---

      // Log the prompt for debugging
      console.log(`Background image prompt: ${backgroundImagePrompt}`);
      console.log(`Background image saved to: ${backgroundImagePath}`);
      return backgroundImagePath;
    } catch (error) {
      console.error('Error generating background image:', error);
      throw error;
    }
  }

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
    return context.trim();
  }
}

export const backgroundImageService = new BackgroundImageService();
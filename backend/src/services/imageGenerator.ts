import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config';
import { StoryStyle } from '@/types';
import fs from 'fs/promises';
import path from 'path';

export class ImageGeneratorService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.google.apiKey);
  }

  /**
   * Generate a reference image for style consistency
   */
  async generateReferenceImage(
    styleInfo: StoryStyle,
    storyId: string
  ): Promise<{ imagePath: string; imageUrl: string }> {
    try {
      console.log('🎨 Generating reference image for style consistency...');

      // Build a comprehensive prompt for the reference image
      const prompt = this.buildReferenceImagePrompt(styleInfo);
      
      console.log(`Prompt: ${prompt.substring(0, 150)}...`);

      // Use Imagen to generate the reference image
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      // Generate image using the text-to-image capability
      // Note: This is a placeholder - adjust based on actual Gemini image generation API
      const result = await model.generateContent([prompt]);
      const response = result.response;
      
      // Save the image locally
      const imagePath = path.join(config.storage.imagesDir, storyId, 'reference.png');
      const imageDir = path.dirname(imagePath);
      
      // Ensure directory exists
      await fs.mkdir(imageDir, { recursive: true });
      
      // For now, create a placeholder since we need the actual image generation API
      // In production, you would download the generated image here
      await fs.writeFile(imagePath, Buffer.from('placeholder'));
      
      console.log(`✓ Reference image saved: ${imagePath}`);

      return {
        imagePath,
        imageUrl: `/api/images/${storyId}/reference`,
      };
    } catch (error) {
      console.error('Error generating reference image:', error);
      throw new Error('Failed to generate reference image');
    }
  }

  /**
   * Build a comprehensive prompt for the reference image
   */
  private buildReferenceImagePrompt(styleInfo: StoryStyle): string {
    let prompt = 'Create a reference image showing the main characters and visual style for a story. ';

    // Add characters
    if (styleInfo.characters && styleInfo.characters.length > 0) {
      prompt += '\n\nCHARACTERS:\n';
      styleInfo.characters.forEach((char, idx) => {
        prompt += `${idx + 1}. ${char.name}: ${char.physicalTraits}\n`;
      });
    }

    // Add setting
    if (styleInfo.setting) {
      prompt += `\n\nSETTING: ${styleInfo.setting.location}`;
      prompt += `\nTime Period: ${styleInfo.setting.timeperiod}`;
      prompt += `\nAtmosphere: ${styleInfo.setting.atmosphere}`;
    }

    // Add visual style
    if (styleInfo.visualStyle) {
      prompt += `\n\nVISUAL STYLE:`;
      prompt += `\nArt Style: ${styleInfo.visualStyle.artStyle}`;
      prompt += `\nColor Palette: ${styleInfo.visualStyle.colorPalette}`;
      prompt += `\nCinematography: ${styleInfo.visualStyle.cinematography}`;
    }

    prompt += '\n\nCompose this as a character lineup or group shot that clearly shows all characters with consistent styling.';

    return prompt;
  }

  /**
   * Convert image file to base64 for API usage
   */
  async imageToBase64(imagePath: string): Promise<string> {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }
}

export const imageGenerator = new ImageGeneratorService();


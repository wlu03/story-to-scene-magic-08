import { GoogleGenAI } from '@google/genai';
import { config } from '@/config';
import { StoryStyle } from '@/types';
import fs from 'fs/promises';
import path from 'path';

export class ImageGeneratorService {
  private ai: any;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: config.google.apiKey,
    });
  }

  /**
   * Generate a reference image for style consistency using Imagen
   * NOTE: Requires Vertex AI setup - see https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview
   */
  async generateReferenceImage(
    styleInfo: StoryStyle,
    storyId: string
  ): Promise<{ imagePath: string; imageUrl: string }> {
    console.log('🎨 Generating reference image for style consistency...');
    
    // Build a comprehensive prompt for the reference image
    const prompt = this.buildReferenceImagePrompt(styleInfo);
    console.log(`Image prompt: ${prompt.substring(0, 150)}...`);

    // Try to generate with Imagen (requires Vertex AI)
    try {
      const result = await this.ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: prompt,
        numberOfImages: 1,
        aspectRatio: '16:9',
      });

      console.log('✓ Image generation completed');
      const generatedImage = result.generatedImages[0];
      
      const imagePath = path.join(config.storage.imagesDir, storyId, 'reference.png');
      const imageDir = path.dirname(imagePath);
      await fs.mkdir(imageDir, { recursive: true });
      
      await this.ai.files.download({
        file: generatedImage.image,
        downloadPath: imagePath,
      });
      
      console.log(`✓ Reference image saved: ${imagePath}`);

      return {
        imagePath,
        imageUrl: `/api/images/${storyId}/reference`,
      };
    } catch (error: any) {
      // Provide helpful error message
      const errorMsg = error?.message || 'Unknown error';
      console.error('❌ Image generation failed:', errorMsg);
      
      if (errorMsg.includes('not found') || errorMsg.includes('NOT_FOUND')) {
        throw new Error(
          'Imagen not available. This feature requires Google Cloud Vertex AI setup.\n' +
          'To enable image generation:\n' +
          '1. Enable Vertex AI API in Google Cloud Console\n' +
          '2. Set up authentication with service account\n' +
          '3. Set ENABLE_REFERENCE_IMAGES=true in .env\n' +
          'See: https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview'
        );
      }
      
      throw new Error(`Image generation failed: ${errorMsg}`);
    }
  }

  /**
   * Build a comprehensive prompt for the reference image
   */
  private buildReferenceImagePrompt(styleInfo: StoryStyle): string {
    let prompt = 'Character reference sheet showing main characters in a lineup. ';

    // Add visual style first (most important for Imagen)
    if (styleInfo.visualStyle) {
      prompt += `Art style: ${styleInfo.visualStyle.artStyle}. `;
      prompt += `Color palette: ${styleInfo.visualStyle.colorPalette}. `;
    }

    // Add characters with concise descriptions
    if (styleInfo.characters && styleInfo.characters.length > 0) {
      prompt += 'Characters standing side by side: ';
      const charDescriptions = styleInfo.characters
        .slice(0, 5) // Limit to 5 main characters
        .map((char, idx) => {
          // Make description concise for Imagen
          const traits = char.physicalTraits.length > 100 
            ? char.physicalTraits.substring(0, 97) + '...'
            : char.physicalTraits;
          return `${char.name} (${traits})`;
        });
      prompt += charDescriptions.join(', ') + '. ';
    }

    // Add setting context
    if (styleInfo.setting) {
      prompt += `Background: ${styleInfo.setting.location}, ${styleInfo.setting.atmosphere} atmosphere. `;
    }

    // Add composition instructions
    prompt += 'Wide shot, all characters visible, clear details, professional character design, consistent style.';

    // Ensure prompt isn't too long for Imagen (limit ~1000 chars)
    if (prompt.length > 1000) {
      prompt = prompt.substring(0, 997) + '...';
    }

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


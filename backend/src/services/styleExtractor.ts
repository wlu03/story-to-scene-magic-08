import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config';
import { StoryStyle } from '@/types';

export class StyleExtractorService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.google.apiKey);
  }

  /**
   * Extract characters, setting, and visual style from story text
   */
  async extractStyleInfo(textContent: string): Promise<StoryStyle> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
You are a story analysis AI. Analyze the following story and extract detailed information about:
1. All main characters (names, descriptions, physical traits)
2. Setting information (location, time period, atmosphere)
3. Visual style suggestions for video generation (art style, color palette, cinematography)

Format your response as a JSON object with this EXACT structure:
{
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief character description and role",
      "physicalTraits": "Detailed physical appearance including age, height, build, hair, eyes, clothing style, distinguishing features"
    }
  ],
  "setting": {
    "location": "Primary locations in the story",
    "timeperiod": "Historical period or era (modern, medieval, futuristic, etc.)",
    "atmosphere": "Overall mood and atmosphere (dark, whimsical, realistic, etc.)"
  },
  "visualStyle": {
    "artStyle": "Recommended visual style (cinematic, animated, realistic, stylized, etc.)",
    "colorPalette": "Dominant colors and color mood (warm, cool, muted, vibrant, etc.)",
    "cinematography": "Camera style and shot recommendations (wide shots, close-ups, dynamic, static, etc.)"
  }
}

Story to analyze:
${textContent}

Return ONLY the JSON object, no additional text or markdown.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          jsonText = match[1].trim();
        }
      }
      
      const styleInfo = JSON.parse(jsonText);
      
      // Validate and set defaults
      return {
        characters: styleInfo.characters || [],
        setting: {
          location: styleInfo.setting?.location || 'Generic location',
          timeperiod: styleInfo.setting?.timeperiod || 'Contemporary',
          atmosphere: styleInfo.setting?.atmosphere || 'Neutral',
        },
        visualStyle: {
          artStyle: styleInfo.visualStyle?.artStyle || 'Cinematic realistic',
          colorPalette: styleInfo.visualStyle?.colorPalette || 'Natural colors',
          cinematography: styleInfo.visualStyle?.cinematography || 'Dynamic camera work',
        },
      };
    } catch (error) {
      console.error('Error extracting style info:', error);
      
      // Return default style info on error
      return {
        characters: [],
        setting: {
          location: 'Generic location',
          timeperiod: 'Contemporary',
          atmosphere: 'Neutral',
        },
        visualStyle: {
          artStyle: 'Cinematic realistic',
          colorPalette: 'Natural colors',
          cinematography: 'Dynamic camera work',
        },
      };
    }
  }
}

export const styleExtractor = new StyleExtractorService();


import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config';
import { StorySegment } from '@/types';

export class StoryAnalyzerService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.google.apiKey);
  }

  /**
   * Analyze story text and break it into video segments
   */
  async analyzeStory(textContent: string): Promise<Omit<StorySegment, 'status'>[]> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
You are a story-to-video AI assistant. Analyze the following story and break it down into 3-5 distinct video scenes.

For each scene, provide:
1. A detailed visual scene description (what should be shown in the video)
2. The narration text (what should be spoken)
3. A short caption/title for the scene
4. A detailed image/video generation prompt optimized for AI video generation

Format your response as a JSON array with this structure:
[
  {
    "sceneDescription": "Brief description",
    "narration": "The narration text",
    "caption": "Scene title",
    "imagePrompt": "Detailed prompt for video generation, including visual style, camera angles, lighting, mood, and key visual elements",
    "duration": 10
  }
]

Story to analyze:
${textContent}

Return ONLY the JSON array, no additional text.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from AI response');
      }

      const segments = JSON.parse(jsonMatch[0]);
      
      // Add IDs and validate
      return segments.map((segment: any, index: number) => ({
        id: index + 1,
        sceneDescription: segment.sceneDescription || '',
        narration: segment.narration || '',
        caption: segment.caption || `Scene ${index + 1}`,
        imagePrompt: segment.imagePrompt || segment.sceneDescription,
        duration: segment.duration || 10,
      }));
    } catch (error) {
      console.error('Error analyzing story:', error);
      throw new Error('Failed to analyze story content');
    }
  }

  /**
   * Enhance a single scene prompt for better video generation
   */
  async enhancePrompt(originalPrompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
Enhance this video generation prompt to make it more detailed and visually descriptive.
Include specifics about: lighting, camera angles, mood, colors, movement, and visual style.
Keep it under 200 words.

Original prompt: ${originalPrompt}

Enhanced prompt:`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      return originalPrompt; // Fallback to original
    }
  }
}

export const storyAnalyzer = new StoryAnalyzerService();


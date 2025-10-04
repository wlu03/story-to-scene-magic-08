import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config';
import { StorySegment, StoryStyle } from '@/types';

export class StoryAnalyzerService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.google.apiKey);
  }

  /**
   * Calculate optimal number of segments based on story length
   */
  private calculateSegmentCount(textContent: string): number {
    // Check if fixed segment count is configured
    if (config.segmentation.fixedSegmentCount > 0) {
      const fixedCount = Math.max(
        config.segmentation.minSegments,
        Math.min(config.segmentation.maxSegments, config.segmentation.fixedSegmentCount)
      );
      console.log(`📊 Using fixed segment count: ${fixedCount}`);
      return fixedCount;
    }

    // Calculate dynamically based on story length
    const wordCount = textContent.split(/\s+/).length;
    const charCount = textContent.length;
    
    // Base calculation on word count
    // Rough guideline: configurable words per segment (default 150)
    let segmentCount: number;
    
    if (wordCount < 300) {
      segmentCount = 3;  // Short story: 3 segments
    } else if (wordCount < 600) {
      segmentCount = 4;  // Medium-short: 4 segments
    } else if (wordCount < 900) {
      segmentCount = 5;  // Medium: 5 segments
    } else if (wordCount < 1200) {
      segmentCount = 6;  // Medium-long: 6 segments
    } else if (wordCount < 1500) {
      segmentCount = 7;  // Long: 7 segments
    } else if (wordCount < 2000) {
      segmentCount = 8;  // Very long: 8 segments
    } else {
      // For very long stories, calculate dynamically
      segmentCount = Math.ceil(wordCount / config.segmentation.wordsPerSegment);
    }
    
    // Clamp to min/max
    segmentCount = Math.max(
      config.segmentation.minSegments,
      Math.min(config.segmentation.maxSegments, segmentCount)
    );
    
    console.log(`📊 Story metrics: ${wordCount} words, ${charCount} characters`);
    console.log(`📊 Calculated segments: ${segmentCount} (${Math.round(wordCount / segmentCount)} words per segment)`);
    
    return segmentCount;
  }

  /**
   * Analyze story text and break it into video segments with style context
   */
  async analyzeStory(textContent: string, styleInfo: StoryStyle): Promise<Omit<StorySegment, 'status'>[]> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Calculate optimal segment count based on story length
    const segmentCount = this.calculateSegmentCount(textContent);

    // Build style context for better prompts
    const styleContext = this.buildStyleContext(styleInfo);
    
    const prompt = `
You are a story-to-video AI assistant. Analyze the following story and break it down into ${segmentCount} distinct video scenes.

IMPORTANT: Create EXACTLY ${segmentCount} scenes based on the story's natural structure and pacing.

STYLE CONTEXT:
${styleContext}

For each scene, provide:
1. A detailed visual scene description (what should be shown in the video)
2. The narration text (what should be spoken)
3. A short caption/title for the scene
4. A detailed video generation prompt optimized for Gemini Veo 3, incorporating the style context above

Format your response as a JSON array with this structure:
[
  {
    "sceneDescription": "Brief description",
    "narration": "The narration text from the story",
    "caption": "Scene title",
    "imagePrompt": "Detailed prompt for Veo 3 video generation. Must include: visual style, camera angles, lighting, mood, character appearances (if applicable), setting details, movement/action, and cinematic qualities. Be very specific and descriptive.",
    "duration": 10
  }
]

Story to analyze:
${textContent}

IMPORTANT: 
- Create EXACTLY ${segmentCount} scenes (no more, no less)
- Distribute the story content evenly across all ${segmentCount} segments
- Each segment should be a meaningful scene with clear visual action
- The imagePrompt should be highly detailed (100-200 words) for best video generation results
- Include character descriptions from the style context when characters appear
- Maintain consistent visual style across all segments
- Specify camera movements and transitions
- Ensure good pacing - don't rush through the story or make scenes too sparse

Return ONLY the JSON array with EXACTLY ${segmentCount} scene objects, no additional text or markdown.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text().trim();
      
      // Remove markdown code blocks if present
      if (text.startsWith('```')) {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          text = match[1].trim();
        }
      }
      
      // Extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from AI response');
      }

      const segments = JSON.parse(jsonMatch[0]);
      
      // Validate we got the expected number of segments
      if (segments.length !== segmentCount) {
        console.warn(`⚠️  Expected ${segmentCount} segments but got ${segments.length}. Adjusting...`);
      }
      
      console.log(`✓ Generated ${segments.length} segments`);
      
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

  /**
   * Enhance a single scene prompt for better video generation
   */
  async enhancePrompt(originalPrompt: string, styleInfo?: StoryStyle): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    let styleContext = '';
    if (styleInfo) {
      styleContext = `\nStyle Context:\n${this.buildStyleContext(styleInfo)}\n`;
    }

    const prompt = `
Enhance this video generation prompt for Gemini Veo 3 to make it more detailed and visually descriptive.
Include specifics about: lighting, camera angles, mood, colors, movement, and visual style.
${styleContext}
Keep the enhanced prompt under 200 words but highly specific.

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


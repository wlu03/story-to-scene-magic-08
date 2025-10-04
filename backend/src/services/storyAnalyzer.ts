import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config';
import { StorySection, StoryStyle } from '@/types';

export class StoryAnalyzerService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.google.apiKey);
  }


  /**
   * Analyze story text and break it into natural video sections with style context
   */
  async analyzeStory(textContent: string, styleInfo: StoryStyle): Promise<Omit<StorySection, 'status'>[]> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build style context for better prompts
    const styleContext = this.buildStyleContext(styleInfo);
    
    const prompt = `
You are a children's story analyzer. Analyze the following children's story and break it down into natural sections based on the story's structure and pacing.

IMPORTANT: 
- This is a CHILDREN'S STORY - keep content appropriate and engaging for young audiences
- Identify natural scene breaks in the story (e.g., when the setting changes, when a new action begins, when characters enter/exit)
- Each section should be a complete, meaningful scene that can be visualized
- Don't force a specific number of sections - let the story's natural structure determine this
- Focus ONLY on creating the story structure and scripts - no video/audio generation

STYLE CONTEXT:
${styleContext}

For each section, provide:
1. A section name (storyname_section_num)
2. A detailed scene description (storyname_scene_num: what happens in this scene)
3. The script (storyname_script_num: direct text from the story for this section)

Format your response as a JSON array with this structure:
[
  {
    "sectionName": "storyname_section_num",
    "sceneDescription": "storyname_scene_num: What happens in this scene",
    "script": "storyname_script_num: Direct text from the story for this section",
    "duration": 8
  }
]

Story to analyze:
${textContent}

IMPORTANT: 
- Let the story's natural structure determine the number of sections
- Each section should be a complete, meaningful scene
- Focus on creating engaging children's story content
- Ensure good pacing - don't rush through the story or make scenes too sparse

Return ONLY the JSON array with the section objects, no additional text or markdown.
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

      const sections = JSON.parse(jsonMatch[0]);
      
      console.log(`✓ Generated ${sections.length} sections`);
      
      // Add IDs and validate
      return sections.map((section: any, index: number) => ({
        id: index + 1,
        sectionName: section.sectionName || `Section ${index + 1}`,
        sceneDescription: section.sceneDescription || '',
        script: section.script || '', // Direct text from story
        duration: section.duration || 8, // Default duration
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


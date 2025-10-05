import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config';
import { fileStorage } from '@/utils/fileStorage';
import { StorySection } from '@/types';
import fetch from 'node-fetch';

export class AudioService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.google.apiKey);
  }

  /**
   * Generate audio for a section using ElevenLabs
   */
  async generateAudio(
    section: StorySection, 
    storyName: string
  ): Promise<string> {
    try {
      const sectionName = fileStorage.sanitizeSectionName(section.sectionName);
      
      console.log(`🎵 Generating audio for section: ${section.sectionName}`);
      
      // Use the regular script directly (no narration script generation)
      const scriptText = section.script;
      
      console.log(`Script text: ${scriptText.substring(0, 100)}...`);
      
      // Generate audio using ElevenLabs API
      const audioBuffer = await this.callElevenLabsAPI(scriptText);
      const audioPath = await fileStorage.saveAudio(storyName, sectionName, audioBuffer);
      
      console.log(`✓ Audio generated: ${audioPath}`);
      return audioPath;
    } catch (error) {
      console.error('Error generating audio:', error);
      throw new Error('Failed to generate audio');
    }
  }


  /**
   * Call ElevenLabs API to generate speech
   */
  private async callElevenLabsAPI(scriptText: string): Promise<Buffer> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': config.elevenlabs.apiKey
        },
        body: JSON.stringify({
          text: scriptText,
          model_id: config.elevenlabs.modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      return audioBuffer;
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      throw new Error('Failed to generate audio with ElevenLabs');
    }
  }
}

export const audioService = new AudioService();

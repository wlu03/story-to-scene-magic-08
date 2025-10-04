import fs from 'fs/promises';
import pdf from 'pdf-parse';

export class FileParserService {
  /**
   * Parse uploaded file and extract text content
   */
  async parseFile(filePath: string, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'text/plain') {
        return await this.parseTxtFile(filePath);
      } else if (mimeType === 'application/pdf') {
        return await this.parsePdfFile(filePath);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new Error('Failed to parse file content');
    }
  }

  /**
   * Parse text file
   */
  private async parseTxtFile(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim();
  }

  /**
   * Parse PDF file
   */
  private async parsePdfFile(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text.trim();
  }

  /**
   * Validate file content
   */
  validateContent(content: string): boolean {
    if (!content || content.length === 0) {
      return false;
    }

    if (content.length < 100) {
      return false;
    }

    if (content.length > 100000) {
      return false;
    }

    return true;
  }

  /**
   * Clean and normalize text content
   */
  cleanContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\t/g, ' ')
      .replace(/ {2,}/g, ' ')
      .trim();
  }
}

export const fileParser = new FileParserService();

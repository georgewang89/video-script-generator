import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { DocumentChunk } from '../../../shared/types';

export class DocumentParser {
  static async parseFile(file: Express.Multer.File): Promise<string> {
    try {
      switch (file.mimetype) {
        case 'application/pdf':
          return await this.parsePDF(file.buffer);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.parseDocx(file.buffer);
        case 'text/plain':
          return file.buffer.toString('utf-8');
        default:
          throw new Error(`Unsupported file type: ${file.mimetype}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async parsePDF(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
  }

  static async parseDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  static chunkText(text: string, fileName: string): DocumentChunk[] {
    // Simple chunking by paragraphs (can be enhanced with better logic)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      
      // If current chunk + new paragraph would be too long, start new chunk
      if (currentChunk.length + trimmed.length > 1000 && currentChunk.length > 0) {
        chunks.push({
          id: uuidv4(),
          title: this.extractTitle(currentChunk),
          content: currentChunk.trim(),
          order: chunkIndex++,
          status: 'pending'
        });
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
      }
    }
    
    // Add the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: uuidv4(),
        title: this.extractTitle(currentChunk),
        content: currentChunk.trim(),
        order: chunkIndex,
        status: 'pending'
      });
    }
    
    return chunks;
  }

  static extractTitle(text: string): string {
    // Extract first sentence or first 50 characters as title
    const sentences = text.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length <= 60) {
      return firstSentence;
    }
    
    // If first sentence is too long, use first 50 characters
    return text.substring(0, 50).trim() + (text.length > 50 ? '...' : '');
  }

  static enhancedChunking(text: string, fileName: string): DocumentChunk[] {
    // More sophisticated chunking based on headings, structure, etc.
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let currentTitle = '';
    let chunkIndex = 0;
    
    for (const line of lines) {
      // Check if line looks like a heading
      if (this.isHeading(line)) {
        // If we have content, save the current chunk
        if (currentChunk.trim()) {
          chunks.push({
            id: uuidv4(),
            title: currentTitle || this.extractTitle(currentChunk),
            content: currentChunk.trim(),
            order: chunkIndex++,
            status: 'pending'
          });
        }
        
        // Start new chunk
        currentTitle = line;
        currentChunk = '';
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
    
    // Add the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: uuidv4(),
        title: currentTitle || this.extractTitle(currentChunk),
        content: currentChunk.trim(),
        order: chunkIndex,
        status: 'pending'
      });
    }
    
    return chunks.length > 0 ? chunks : this.chunkText(text, fileName);
  }

  static isHeading(line: string): boolean {
    // Simple heading detection
    return (
      line.length < 100 && // Headings are usually short
      (
        /^[A-Z][^.]*[^.]$/.test(line) || // Starts with capital, no period at end
        /^\d+\./.test(line) || // Starts with number
        /^[A-Z\s]+$/.test(line) // All caps
      )
    );
  }
}
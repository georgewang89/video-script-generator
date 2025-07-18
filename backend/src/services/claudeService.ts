import { exec } from 'child_process';
import { promisify } from 'util';
import { ScriptData } from '../../../shared/types';

const execAsync = promisify(exec);

export class ClaudeService {
  static async generateScript(content: string): Promise<ScriptData> {
    const prompt = `
Rewrite this paragraph into a natural, human-sounding video script in under 210 characters per paragraph.
Tone: Warm, conversational, like an advisor speaking to a smart client.
Avoid jargon, sound natural.
Also suggest a short title and one camera or gesture direction for realism.
Return the result in JSON with "title", "script_chunks", "camera_direction", and "environment".

Content:
${content}

Requirements:
- Each script chunk should be under 210 characters
- Break into 3-5 natural speaking segments
- Sound conversational and warm
- Avoid sales-speak or jargon
- Include realistic camera directions
- Suggest appropriate environment setting

Return only valid JSON.
`;

    try {
      // Use Claude Code directly
      const { stdout } = await execAsync(`echo "${prompt.replace(/"/g, '\\"')}" | claude`);
      
      // Parse the JSON response
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!result.title || !result.script_chunks || !result.camera_direction || !result.environment) {
        throw new Error('Invalid response structure from Claude');
      }
      
      // Ensure script_chunks is an array
      if (!Array.isArray(result.script_chunks)) {
        result.script_chunks = [result.script_chunks];
      }
      
      // Validate character limits
      result.script_chunks = result.script_chunks.map((chunk: string) => {
        if (chunk.length > 210) {
          return chunk.substring(0, 210) + '...';
        }
        return chunk;
      });
      
      return result as ScriptData;
    } catch (error) {
      console.error('Claude API Error:', error);
      
      // Fallback to a simple script generation
      return this.generateFallbackScript(content);
    }
  }

  static generateFallbackScript(content: string): ScriptData {
    // Simple fallback script generation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const title = sentences[0]?.trim().substring(0, 50) || 'Main Topic';
    
    // Break content into chunks of ~200 characters
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (currentChunk.length + trimmed.length > 200 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim() + '.');
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmed;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim() + '.');
    }
    
    return {
      title,
      script_chunks: chunks.slice(0, 5), // Limit to 5 chunks
      camera_direction: 'Direct eye contact with camera, natural gestures when emphasizing points',
      environment: 'Well-lit office or home setting with soft, natural lighting'
    };
  }

  static async testClaudeConnection(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('claude --version');
      return stdout.includes('claude');
    } catch (error) {
      console.warn('Claude Code not available, will use fallback script generation');
      return false;
    }
  }
}
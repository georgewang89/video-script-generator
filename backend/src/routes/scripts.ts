import { Router } from 'express';
import { ClaudeService } from '../services/claudeService';
import { sessions } from './upload';

const router = Router();

// Generate script for a chunk
router.post('/generate', async (req, res) => {
  try {
    const { chunkId, content } = req.body;
    
    if (!chunkId || !content) {
      return res.status(400).json({
        error: true,
        message: 'chunkId and content are required'
      });
    }

    // Generate script using Claude
    const script = await ClaudeService.generateScript(content);
    
    // Update chunk in all sessions
    for (const [sessionId, session] of sessions) {
      const chunkIndex = session.chunks.findIndex(c => c.id === chunkId);
      if (chunkIndex !== -1) {
        session.chunks[chunkIndex].script = script;
        session.chunks[chunkIndex].status = 'script_ready';
        break;
      }
    }

    res.json({
      script,
      message: 'Script generated successfully'
    });
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Script generation failed'
    });
  }
});

// Get script for a chunk
router.get('/:chunkId', (req, res) => {
  const { chunkId } = req.params;
  
  // Find chunk in sessions
  for (const [sessionId, session] of sessions) {
    const chunk = session.chunks.find(c => c.id === chunkId);
    if (chunk && chunk.script) {
      return res.json(chunk.script);
    }
  }
  
  res.status(404).json({
    error: true,
    message: 'Script not found'
  });
});

// Update script for a chunk
router.put('/:chunkId', async (req, res) => {
  try {
    const { chunkId } = req.params;
    const { script } = req.body;
    
    if (!script) {
      return res.status(400).json({
        error: true,
        message: 'Script data is required'
      });
    }

    // Update chunk in sessions
    let found = false;
    for (const [sessionId, session] of sessions) {
      const chunkIndex = session.chunks.findIndex(c => c.id === chunkId);
      if (chunkIndex !== -1) {
        session.chunks[chunkIndex].script = script;
        session.chunks[chunkIndex].status = 'script_ready';
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        error: true,
        message: 'Chunk not found'
      });
    }

    res.json({
      message: 'Script updated successfully'
    });
  } catch (error) {
    console.error('Script update error:', error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Script update failed'
    });
  }
});

// Test Claude connection
router.get('/test-claude', async (req, res) => {
  try {
    const isConnected = await ClaudeService.testClaudeConnection();
    res.json({
      connected: isConnected,
      message: isConnected ? 'Claude Code is available' : 'Claude Code not available, using fallback'
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Connection test failed'
    });
  }
});

export default router;
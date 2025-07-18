import { Router } from 'express';
import { sessions } from './upload';

const router = Router();

// Get all chunks for a session
router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      error: true,
      message: 'Session not found'
    });
  }
  
  res.json({
    chunks: session.chunks,
    status: session.status
  });
});

// Get specific chunk
router.get('/:chunkId', (req, res) => {
  const { chunkId } = req.params;
  
  // Find chunk in sessions
  for (const [sessionId, session] of sessions) {
    const chunk = session.chunks.find(c => c.id === chunkId);
    if (chunk) {
      return res.json(chunk);
    }
  }
  
  res.status(404).json({
    error: true,
    message: 'Chunk not found'
  });
});

// Update chunk content
router.put('/:chunkId', (req, res) => {
  const { chunkId } = req.params;
  const { title, content } = req.body;
  
  // Find and update chunk
  let found = false;
  for (const [sessionId, session] of sessions) {
    const chunkIndex = session.chunks.findIndex(c => c.id === chunkId);
    if (chunkIndex !== -1) {
      if (title) session.chunks[chunkIndex].title = title;
      if (content) session.chunks[chunkIndex].content = content;
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
    message: 'Chunk updated successfully'
  });
});

// Reorder chunks
router.post('/session/:sessionId/reorder', (req, res) => {
  const { sessionId } = req.params;
  const { chunkIds } = req.body;
  
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      error: true,
      message: 'Session not found'
    });
  }
  
  if (!Array.isArray(chunkIds)) {
    return res.status(400).json({
      error: true,
      message: 'chunkIds must be an array'
    });
  }
  
  // Reorder chunks
  const reorderedChunks = chunkIds.map(id => {
    const chunk = session.chunks.find(c => c.id === id);
    return chunk;
  }).filter(chunk => chunk !== undefined);
  
  // Update order property
  reorderedChunks.forEach((chunk, index) => {
    if (chunk) {
      chunk.order = index;
    }
  });
  
  session.chunks = reorderedChunks;
  
  res.json({
    message: 'Chunks reordered successfully',
    chunks: session.chunks
  });
});

// Delete chunk
router.delete('/:chunkId', (req, res) => {
  const { chunkId } = req.params;
  
  // Find and delete chunk
  let found = false;
  for (const [sessionId, session] of sessions) {
    const chunkIndex = session.chunks.findIndex(c => c.id === chunkId);
    if (chunkIndex !== -1) {
      session.chunks.splice(chunkIndex, 1);
      
      // Update order for remaining chunks
      session.chunks.forEach((chunk, index) => {
        chunk.order = index;
      });
      
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
    message: 'Chunk deleted successfully'
  });
});

export default router;
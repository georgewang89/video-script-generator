import { Router } from 'express';
import { VeoService } from '../services/veoService';
import { sessions } from './upload';

const router = Router();

// Store video generation jobs
const videoJobs: Map<string, any> = new Map();

// Generate video for a chunk
router.post('/generate', async (req, res) => {
  try {
    const { chunkId, script, camera_direction, environment, duration } = req.body;
    
    if (!chunkId || !script) {
      return res.status(400).json({
        error: true,
        message: 'chunkId and script are required'
      });
    }

    // Generate video using Veo 3 via fal.ai
    const videoResponse = await VeoService.generateVideo({
      script,
      camera_direction,
      environment,
      duration
    });
    
    // Store video job
    videoJobs.set(videoResponse.id, {
      chunkId,
      ...videoResponse
    });

    // Update chunk status based on video generation result
    for (const [sessionId, session] of sessions) {
      const chunkIndex = session.chunks.findIndex(c => c.id === chunkId);
      if (chunkIndex !== -1) {
        if (videoResponse.status === 'completed') {
          session.chunks[chunkIndex].status = 'video_ready';
          session.chunks[chunkIndex].videoUrl = videoResponse.videoUrl;
        } else {
          session.chunks[chunkIndex].status = 'generating_video';
        }
        break;
      }
    }

    res.json({
      videoId: videoResponse.id,
      status: videoResponse.status,
      videoUrl: videoResponse.videoUrl,
      message: videoResponse.status === 'completed' ? 'Video generation completed' : 'Video generation started'
    });
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Video generation failed'
    });
  }
});

// Get video status
router.get('/status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Get the job to retrieve the fal.ai request ID
    const job = videoJobs.get(videoId);
    const falRequestId = job?.falRequestId;
    
    const status = await VeoService.getVideoStatus(videoId, falRequestId);
    
    // Update video job
    if (job) {
      videoJobs.set(videoId, { ...job, ...status });
      
      // Update chunk status if video is complete
      if (status.status === 'completed' && status.videoUrl) {
        for (const [sessionId, session] of sessions) {
          const chunkIndex = session.chunks.findIndex(c => c.id === job.chunkId);
          if (chunkIndex !== -1) {
            session.chunks[chunkIndex].videoUrl = status.videoUrl;
            session.chunks[chunkIndex].status = 'video_ready';
            break;
          }
        }
      }
    }

    res.json(status);
  } catch (error) {
    console.error('Video status error:', error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Failed to get video status'
    });
  }
});

// Get video file
router.get('/:videoId/download', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const job = videoJobs.get(videoId);
    if (!job || !job.videoUrl) {
      return res.status(404).json({
        error: true,
        message: 'Video not found or not ready'
      });
    }

    const videoBuffer = await VeoService.downloadVideo(job.videoUrl);
    
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="video_${videoId}.mp4"`);
    res.send(videoBuffer);
  } catch (error) {
    console.error('Video download error:', error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Video download failed'
    });
  }
});

// Get video thumbnail
router.get('/thumbnail/:chunkId', (req, res) => {
  const { chunkId } = req.params;
  
  // Mock thumbnail - in production, generate actual thumbnails
  const mockThumbnail = Buffer.from('mock-thumbnail-data');
  
  res.setHeader('Content-Type', 'image/jpeg');
  res.send(mockThumbnail);
});

// Test fal.ai connection
router.get('/test-fal', async (req, res) => {
  try {
    const isConnected = await VeoService.testFalConnection();
    res.json({
      connected: isConnected,
      message: isConnected ? 'fal.ai API is available' : 'fal.ai API not available, using mock implementation'
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Connection test failed'
    });
  }
});

// Keep old endpoint for compatibility
router.get('/test-veo', async (req, res) => {
  try {
    const isConnected = await VeoService.testVeoConnection();
    res.json({
      connected: isConnected,
      message: isConnected ? 'fal.ai API is available' : 'fal.ai API not available, using mock implementation'
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Connection test failed'
    });
  }
});

export default router;
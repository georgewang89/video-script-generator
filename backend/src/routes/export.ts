import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { sessions } from './upload';
import { ExportRequest, ExportResponse } from '../../../shared/types';

const router = Router();
const execAsync = promisify(exec);

// Store export jobs
const exportJobs: Map<string, any> = new Map();

// Start export process
router.post('/', async (req, res) => {
  try {
    const { sessionId, includeIntro, includeOutro, backgroundMusic }: ExportRequest = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        error: true,
        message: 'sessionId is required'
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        error: true,
        message: 'Session not found'
      });
    }

    // Check if all videos are ready
    const unreadyChunks = session.chunks.filter(c => c.status !== 'video_ready' || !c.videoUrl);
    if (unreadyChunks.length > 0) {
      return res.status(400).json({
        error: true,
        message: 'Not all videos are ready for export'
      });
    }

    const exportId = uuidv4();
    const exportJob = {
      id: exportId,
      sessionId,
      status: 'pending',
      progress: 0,
      includeIntro,
      includeOutro,
      backgroundMusic,
      startTime: new Date()
    };

    exportJobs.set(exportId, exportJob);

    // Start export process asynchronously
    processExport(exportId);

    res.json({
      exportId,
      status: 'pending',
      message: 'Export started'
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Export failed'
    });
  }
});

// Get export status
router.get('/status/:exportId', (req, res) => {
  const { exportId } = req.params;
  const job = exportJobs.get(exportId);
  
  if (!job) {
    return res.status(404).json({
      error: true,
      message: 'Export job not found'
    });
  }
  
  res.json({
    exportId: job.id,
    status: job.status,
    progress: job.progress,
    downloadUrl: job.downloadUrl,
    error: job.error
  });
});

// Download exported video
router.get('/download/:exportId', async (req, res) => {
  try {
    const { exportId } = req.params;
    const job = exportJobs.get(exportId);
    
    if (!job || job.status !== 'completed' || !job.outputPath) {
      return res.status(404).json({
        error: true,
        message: 'Export not found or not completed'
      });
    }

    const fileBuffer = await fs.readFile(job.outputPath);
    
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="exported_video_${exportId}.mp4"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Download failed'
    });
  }
});

// Process export (async function)
async function processExport(exportId: string) {
  const job = exportJobs.get(exportId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.progress = 10;

    const session = sessions.get(job.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Create temporary directory
    const tempDir = path.join(process.cwd(), 'temp', exportId);
    await fs.mkdir(tempDir, { recursive: true });

    job.progress = 20;

    // Download all videos
    const videoFiles: string[] = [];
    for (let i = 0; i < session.chunks.length; i++) {
      const chunk = session.chunks[i];
      if (chunk.videoUrl) {
        // In a real implementation, download from chunk.videoUrl
        // For now, create a mock file
        const videoPath = path.join(tempDir, `video_${i}.mp4`);
        await fs.writeFile(videoPath, `mock video content for chunk ${i}`);
        videoFiles.push(videoPath);
      }
    }

    job.progress = 50;

    // Create video list file for FFmpeg
    const videoListPath = path.join(tempDir, 'video_list.txt');
    const videoListContent = videoFiles.map(file => `file '${file}'`).join('\n');
    await fs.writeFile(videoListPath, videoListContent);

    job.progress = 60;

    // Generate intro/outro if needed
    if (job.includeIntro) {
      const introPath = path.join(tempDir, 'intro.mp4');
      await generateIntroVideo(introPath, session.fileName);
      videoFiles.unshift(introPath);
    }

    if (job.includeOutro) {
      const outroPath = path.join(tempDir, 'outro.mp4');
      await generateOutroVideo(outroPath);
      videoFiles.push(outroPath);
    }

    job.progress = 70;

    // Concatenate videos using FFmpeg
    const outputPath = path.join(tempDir, 'final_video.mp4');
    const ffmpegCommand = [
      'ffmpeg',
      '-f', 'concat',
      '-safe', '0',
      '-i', videoListPath,
      '-c', 'copy',
      outputPath
    ].join(' ');

    // Mock FFmpeg execution (replace with actual FFmpeg call)
    await new Promise(resolve => setTimeout(resolve, 2000));
    await fs.writeFile(outputPath, 'mock final video content');

    job.progress = 90;

    // Add background music if specified
    if (job.backgroundMusic) {
      const musicPath = path.join(tempDir, 'music.mp3');
      const finalWithMusicPath = path.join(tempDir, 'final_with_music.mp4');
      
      // Mock music addition
      await fs.writeFile(finalWithMusicPath, 'mock video with music content');
      job.outputPath = finalWithMusicPath;
    } else {
      job.outputPath = outputPath;
    }

    job.progress = 100;
    job.status = 'completed';
    job.downloadUrl = `/api/export/download/${exportId}`;
    job.completedAt = new Date();

  } catch (error) {
    console.error('Export processing error:', error);
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Export processing failed';
  }
}

// Generate intro video
async function generateIntroVideo(outputPath: string, title: string) {
  // Mock intro generation
  await fs.writeFile(outputPath, `mock intro video for ${title}`);
}

// Generate outro video
async function generateOutroVideo(outputPath: string) {
  // Mock outro generation
  await fs.writeFile(outputPath, 'mock outro video');
}

// Clean up old export jobs (run periodically)
setInterval(() => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  for (const [exportId, job] of exportJobs) {
    if (job.startTime < oneDayAgo) {
      // Clean up files
      if (job.outputPath) {
        fs.unlink(job.outputPath).catch(console.error);
      }
      exportJobs.delete(exportId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

export default router;
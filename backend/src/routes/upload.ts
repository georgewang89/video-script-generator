import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { DocumentParser } from '../services/documentParser';
import { ProcessingSession } from '../../../shared/types';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

// Store sessions in memory (use database in production)
const sessions: Map<string, ProcessingSession> = new Map();

// File upload endpoint
router.post('/', upload.single('file'), async (req, res) => {
  try {
    let text: string;
    let fileName: string;

    if (req.file) {
      // File upload
      text = await DocumentParser.parseFile(req.file);
      fileName = req.file.originalname;
    } else if (req.body.text && req.body.fileName) {
      // Text input
      text = req.body.text;
      fileName = req.body.fileName;
    } else {
      return res.status(400).json({
        error: true,
        message: 'Either file or text input is required'
      });
    }

    // Generate chunks
    const chunks = DocumentParser.enhancedChunking(text, fileName);
    
    // Create session
    const sessionId = uuidv4();
    const session: ProcessingSession = {
      id: sessionId,
      fileName,
      chunks,
      createdAt: new Date(),
      status: 'chunking'
    };

    // Store session
    sessions.set(sessionId, session);

    res.json({
      sessionId,
      chunks,
      message: 'Document processed successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

// Get session
router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      error: true,
      message: 'Session not found'
    });
  }
  
  res.json(session);
});

// Export sessions for other modules
export { sessions };
export default router;
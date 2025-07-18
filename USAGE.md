# Video Script Generator - Usage Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Claude Code CLI installed and configured
- fal.ai API access (included in project)
- FFmpeg installed (for video processing)

### Installation

1. **Clone or download the project**
2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

3. **Configure environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the development servers:**
   ```bash
   npm run dev
   ```

## 📋 Step-by-Step Usage

### 1. Upload Document
- **File Upload**: Drag and drop PDF, DOCX, or TXT files
- **Text Input**: Paste content directly and provide a filename
- Maximum file size: 10MB
- Supported formats: PDF, DOCX, TXT

### 2. Review Chunks
- The system automatically breaks your document into logical sections
- Each chunk represents one video segment
- Review and edit chunk titles and content as needed
- Chunks are ordered sequentially

### 3. Generate Scripts
- Click "Generate Script" for individual chunks or "Generate All Scripts"
- Scripts are created using Claude Code with conversational tone
- Each script includes:
  - Natural, warm dialogue (under 210 chars per segment)
  - Camera direction suggestions
  - Environment recommendations
- Edit scripts manually if needed

### 4. Generate Videos
- Once scripts are ready, generate videos using fal.ai
- Monitor progress in real-time
- Preview generated videos
- Regenerate any video if needed
- Reorder videos by dragging

### 5. Export Final Video
- Choose export options:
  - Include intro/outro slides
  - Add background music
  - Select video quality (720p, 1080p, 4K)
- System stitches all videos into one file
- Download the final video

## 🔧 API Endpoints

### Upload
- `POST /api/upload` - Upload file or text
- `GET /api/upload/session/:sessionId` - Get session data

### Chunks
- `GET /api/chunks/session/:sessionId` - Get all chunks
- `GET /api/chunks/:chunkId` - Get specific chunk
- `PUT /api/chunks/:chunkId` - Update chunk
- `POST /api/chunks/session/:sessionId/reorder` - Reorder chunks

### Scripts
- `POST /api/scripts/generate` - Generate script for chunk
- `GET /api/scripts/:chunkId` - Get script
- `PUT /api/scripts/:chunkId` - Update script

### Videos
- `POST /api/videos/generate` - Generate video
- `GET /api/videos/status/:videoId` - Check video status
- `GET /api/videos/:videoId/download` - Download video

### Export
- `POST /api/export` - Start export process
- `GET /api/export/status/:exportId` - Check export status
- `GET /api/export/download/:exportId` - Download final video

## 🎨 Frontend Components

### Main App Flow
1. **FileUpload** - Document upload interface
2. **ProgressTracker** - Multi-step progress indicator
3. **ChunkViewer** - Review and edit document chunks
4. **VideoPreview** - Generate and preview videos
5. **ExportSection** - Final video export options

### Key Features
- **Responsive Design** - Works on desktop and mobile
- **Real-time Updates** - Progress tracking via WebSocket
- **Drag & Drop** - Easy file uploads and video reordering
- **Error Handling** - Graceful error messages and recovery

## 🛠️ Development

### Project Structure
```
video-script-generator/
├── frontend/          # React TypeScript app
│   ├── src/
│   │   ├── components/
│   │   ├── types.ts
│   │   └── App.tsx
│   └── package.json
├── backend/           # Node.js Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── index.ts
│   └── package.json
├── shared/            # Shared TypeScript types
└── README.md
```

### Scripts
- `npm run dev` - Start both frontend and backend
- `npm run backend:dev` - Start backend only
- `npm run frontend:dev` - Start frontend only
- `npm run build` - Build both applications
- `npm run install:all` - Install all dependencies

### Docker Support
```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up
```

## 🔌 Integration

### Claude Code Integration
The system uses Claude Code CLI for script generation:
```bash
# Test Claude connection
curl http://localhost:3001/api/scripts/test-claude
```

### fal.ai Integration
Real API integration with your provided API key:
```bash
# Test fal.ai connection
curl http://localhost:3001/api/videos/test-fal
```

## 📊 Monitoring

### Health Checks
- `GET /health` - Backend health status
- Monitor logs for errors and performance
- WebSocket connections for real-time updates

### Performance
- File processing is async to prevent blocking
- Video generation uses polling for status updates
- Export process runs in background

## 🐛 Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check file size (max 10MB)
   - Verify file format (PDF, DOCX, TXT)
   - Ensure backend is running

2. **Script Generation Fails**
   - Verify Claude Code is installed: `claude --version`
   - Check API key in .env file
   - Fallback script generation available

3. **Video Generation Slow**
   - fal.ai processing can take time
   - Check API rate limits
   - Monitor video status endpoint

4. **Export Fails**
   - Ensure FFmpeg is installed
   - Check disk space for temporary files
   - Verify all videos are ready

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and stack traces.

## 📈 Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=3001
CLAUDE_API_KEY=your_api_key
FAL_API_KEY=928f660d-bb6d-488b-80dc-692e4b7172fa:d501ee801b4e8aaf613dc13ea440a4de
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
```

### Scaling Considerations
- Use Redis for session storage
- Implement proper database for persistent data
- Set up file storage (AWS S3, Google Cloud Storage)
- Use job queues for video processing
- Load balancer for multiple instances

### Security
- Rate limiting on API endpoints
- File type validation
- Input sanitization
- CORS configuration
- HTTPS in production

## 🆘 Support

For issues and feature requests:
1. Check the troubleshooting section
2. Review API documentation
3. Check logs for error messages
4. Test individual components

## 📚 Additional Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs)
- [fal.ai API Documentation](https://fal.ai/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [React Documentation](https://react.dev)
- [Node.js Documentation](https://nodejs.org/docs)
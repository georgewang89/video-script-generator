# Video Script Generator

Transform documents into natural, conversational video series using Claude Code and Veo 3 via fal.ai.

## Features

- **Document Upload**: Support for PDF, DOCX, and raw text input
- **Intelligent Chunking**: Break content into logical sections
- **Script Generation**: Claude Code transforms content into conversational scripts
- **Video Generation**: Veo 3 integration via fal.ai for creating professional videos
- **Real-time Progress**: Live updates during video generation
- **Preview & Edit**: Review, reorder, and regenerate video clips
- **Export**: Stitch clips into a single exportable video

## Architecture

```
video-script-generator/
├── frontend/          # React app for user interface
├── backend/           # Node.js API server
├── shared/            # Common types and utilities
└── README.md
```

## Getting Started

### Development Setup
```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev
```

### Deploy to Vercel
```bash
# Quick deploy
./deploy.sh

# Or manually
npm run deploy
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript (Serverless)
- **Deployment**: Vercel (Frontend + API)
- **AI Integration**: Claude Code, Veo 3 via fal.ai
- **Video Processing**: FFmpeg
- **File Processing**: PDF parsing libraries

## Workflow

1. **Upload** → User uploads document or pastes text
2. **Chunking** → Backend breaks content into logical sections
3. **Script Review** → Claude generates conversational scripts
4. **Video Generation** → Veo 3 creates videos from scripts via fal.ai
5. **Preview & Export** → User reviews and exports final video

## Environment Variables

```env
CLAUDE_API_KEY=your_claude_api_key
FAL_API_KEY=928f660d-bb6d-488b-80dc-692e4b7172fa:d501ee801b4e8aaf613dc13ea440a4de
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```
# Story to Scene Magic - Backend

Backend API for the Story to Scene Magic application. Converts story text into video segments using Google's Gemini Veo 3.

## Features

- 📁 **Local File Storage** - No database required, everything stored in JSON files and local folders
- 🎬 **Gemini Veo 3 Integration** - Generate videos from text prompts with advanced configuration
- 📝 **Story Analysis** - AI-powered story segmentation using Gemini Pro
- 🎨 **Style Extraction** - Automatic extraction of characters, setting, and visual style
- 🎥 **Video Management** - Generate, store, and stream video content
- 📊 **Processing Status** - Real-time progress tracking with detailed steps

## Documentation

- 📖 **[Data Flow Diagram](DATA_FLOW.md)** - Complete pipeline visualization
- 🚀 **[Quick Start Guide](QUICKSTART.md)** - Get up and running fast

## Tech Stack

- **Node.js** + **TypeScript**
- **Express** - REST API framework
- **Google Generative AI** - Gemini Pro & Veo 3
- **Multer** - File upload handling
- **Local filesystem** - JSON-based data storage

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration management
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   │   ├── fileParser.ts       # Text/PDF parsing
│   │   ├── geminiVeo.ts        # Veo 3 video generation
│   │   ├── storyAnalyzer.ts    # Story segmentation
│   │   └── processor.ts        # Main processing pipeline
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   │   └── fileStorage.ts      # Local file operations
│   └── index.ts         # Application entry point
├── data/                # Local data storage (gitignored)
│   ├── uploads/         # Uploaded story files
│   ├── stories/         # Story metadata (JSON)
│   ├── videos/          # Generated videos
│   └── images/          # Generated images/thumbnails
├── package.json
├── tsconfig.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Cloud API Key with Gemini API access

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` with your credentials:**
   ```env
   GOOGLE_API_KEY=your_google_api_key_here
   PORT=3001
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## API Endpoints

### Upload Story
```http
POST /api/upload
Content-Type: multipart/form-data

file: <story.txt or story.pdf>
```

**Response:**
```json
{
  "success": true,
  "storyId": "uuid",
  "message": "File uploaded successfully. Processing started."
}
```

### Get Story Status
```http
GET /api/stories/:storyId/status
```

**Response:**
```json
{
  "storyId": "uuid",
  "status": "generating",
  "progress": 45,
  "currentStep": "Generating video 2 of 4...",
  "segments": [...]
}
```

### Get Story Details
```http
GET /api/stories/:storyId
```

### List All Stories
```http
GET /api/stories
```

### Stream Video
```http
GET /api/videos/:storyId/:segmentId
```

### Download Video
```http
GET /api/videos/:storyId/:segmentId/download
```

### Regenerate Segment
```http
POST /api/stories/:storyId/segments/:segmentId/regenerate
```

### Health Check
```http
GET /health
```

## Data Storage Structure

Stories are stored as JSON files in the `data/stories/` directory:

```json
{
  "id": "story-uuid",
  "originalFilename": "my-story.txt",
  "uploadedAt": "2025-10-04T12:00:00Z",
  "status": "completed",
  "progress": 100,
  "textContent": "Once upon a time...",
  "segments": [
    {
      "id": 1,
      "sceneDescription": "A peaceful morning",
      "narration": "The sun rose gently...",
      "caption": "Chapter 1",
      "imagePrompt": "Cinematic shot of sunrise...",
      "videoPath": "/data/videos/story-uuid/segment-1.mp4",
      "videoUrl": "/api/videos/story-uuid/1",
      "duration": 10,
      "status": "completed"
    }
  ]
}
```

## Gemini Veo 3 Integration

The `geminiVeo.ts` service handles video generation:

```typescript
await geminiVeo.generateVideo({
  prompt: "Cinematic shot of a sunrise over mountains",
  duration: 10,
  aspectRatio: "16:9"
});
```

**Note:** The Gemini Veo 3 integration is now fully implemented using the official `@google/genai` package. Videos are generated asynchronously with polling, then downloaded and stored locally.

## Processing Pipeline

```
PDF/TXT Upload
    ↓
Parse & Store (data/uploads/)
    ↓
Extract Style Info (Gemini Pro)
  • Characters (name, traits)
  • Setting (location, time, atmosphere)
  • Visual Style (art, colors, cinematography)
    ↓
Generate Segments (Gemini Pro)
  • Scene descriptions
  • Narrations
  • Detailed video prompts
    ↓
Generate Videos (Gemini Veo 3)
  • For each segment
  • Stored in data/videos/{storyId}/
    ↓
Complete (JSON saved in data/stories/)
```

**See [DATA_FLOW.md](DATA_FLOW.md) for detailed pipeline visualization.**

## Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Configuration

All configuration is in `src/config/index.ts` and can be overridden with environment variables:

- `PORT` - Server port (default: 3001)
- `GOOGLE_API_KEY` - Google Cloud API key
- `DATA_DIR` - Base directory for data storage
- `VEO_MODEL` - Gemini model to use (default: gemini-2.0-flash-exp)
- `MAX_FILE_SIZE` - Maximum upload file size in bytes
- `ALLOWED_ORIGINS` - CORS allowed origins

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## Troubleshooting

**Videos not generating:**
- Verify your Google API key has Gemini API access
- Check the Veo 3 model name in `.env`
- Review logs for API errors

**File upload fails:**
- Check file size limits (default 10MB)
- Verify file type is .txt or .pdf
- Ensure `data/uploads` directory exists and is writable

**Storage issues:**
- Ensure adequate disk space
- Check file permissions on `data/` directory
- Verify paths in configuration

## Future Enhancements

- [ ] WebSocket support for real-time progress updates
- [ ] Batch processing for multiple stories
- [ ] Video thumbnail generation
- [ ] Audio narration generation
- [ ] Export full storyboard as single video
- [ ] Advanced prompt engineering options
- [ ] Rate limiting and queue management

## License

MIT


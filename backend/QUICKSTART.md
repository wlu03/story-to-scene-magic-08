# Quick Start Guide

## Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
GOOGLE_API_KEY=your_google_api_key_here
PORT=3001
```

3. **Start the server:**
```bash
npm run dev
```

Server will start on `http://localhost:3001`

## Testing the Pipeline

### 1. Upload a Story

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@your-story.pdf"
```

Response:
```json
{
  "success": true,
  "storyId": "abc-123-def",
  "message": "File uploaded successfully. Processing started."
}
```

### 2. Monitor Progress

```bash
curl http://localhost:3001/api/stories/abc-123-def/status
```

Response:
```json
{
  "storyId": "abc-123-def",
  "status": "generating_videos",
  "progress": 65,
  "currentStep": "Generating video 2 of 3: The Journey Begins"
}
```

### 3. Check Style Info

```bash
curl http://localhost:3001/api/stories/abc-123-def/style
```

### 4. Get Complete Story

```bash
curl http://localhost:3001/api/stories/abc-123-def
```

### 5. View Video in Browser

Open: `http://localhost:3001/api/videos/abc-123-def/1`

### 6. Download Video

```bash
curl -O http://localhost:3001/api/videos/abc-123-def/1/download
```

## Console Output

When processing, you'll see:

```
📄 File uploaded: my-story.pdf
Story ID: abc-123-def
Content length: 5432 characters

🎬 Starting processing for story: my-story.pdf

📝 Extracting style information...
✓ Style info extracted: { characters: 2, setting: 'Medieval village', style: 'Cinematic fantasy' }

🎭 Analyzing story and creating segments...
✓ Created 3 segments

🎥 Generating 3 videos...

📹 Segment 1/3: Chapter 1: A New Beginning
Prompt: Cinematic wide shot of a quaint medieval village at sunrise...
✓ Video generated successfully: /data/videos/abc-123-def/segment-1.mp4

📹 Segment 2/3: The Journey Begins
...

✓ Processing complete for story: my-story.pdf
Total segments: 3
Successful: 3
Failed: 0
```

## Data Location

All data is stored locally in `backend/data/`:

- **Uploads:** `data/uploads/{uuid}.pdf`
- **Stories:** `data/stories/{storyId}.json`
- **Videos:** `data/videos/{storyId}/segment-{N}.mp4`

## Regenerate a Failed Segment

If a segment fails, regenerate it:

```bash
curl -X POST http://localhost:3001/api/stories/abc-123-def/segments/2/regenerate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Optional new prompt to use"}'
```

## Frontend Integration

Update your frontend `handleFileSelect` to call the API:

```typescript
const handleFileSelect = async (file: File) => {
  setCurrentView("processing");
  
  // Upload file
  const formData = new FormData();
  formData.append('file', file);
  
  const uploadRes = await fetch('http://localhost:3001/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  const { storyId } = await uploadRes.json();
  
  // Poll for status
  const interval = setInterval(async () => {
    const statusRes = await fetch(`http://localhost:3001/api/stories/${storyId}/status`);
    const status = await statusRes.json();
    
    setProcessingProgress(status.progress);
    
    if (status.status === 'completed') {
      clearInterval(interval);
      // Load segments and show viewer
      setCurrentView("viewer");
    }
  }, 2000);
};
```

## Troubleshooting

**Videos not generating:**
- Check Google API key is valid
- Verify Veo 3 API access is enabled
- Check console logs for errors

**Upload fails:**
- Ensure file is .txt or .pdf
- Check file size < 10MB
- Verify content is at least 100 characters

**Storage issues:**
- Ensure `data/` directory is writable
- Check disk space

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

3. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start dist/index.js --name story-backend
```

4. Configure reverse proxy (nginx):
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```


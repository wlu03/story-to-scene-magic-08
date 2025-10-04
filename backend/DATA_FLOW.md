# Story to Scene Magic - Data Flow

## Complete Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STORY PROCESSING PIPELINE                     │
└─────────────────────────────────────────────────────────────────────┘

1. UPLOAD (5% progress)
   ┌──────────────┐
   │  PDF/TXT     │  ──→  Upload to backend
   │  Story File  │
   └──────────────┘
         │
         ↓
   ┌──────────────────────────────────────┐
   │  • Save to: data/uploads/            │
   │  • Parse PDF/TXT to text             │
   │  • Validate content (100-100k chars) │
   │  • Clean & normalize text            │
   └──────────────────────────────────────┘
         │
         ↓
   ┌──────────────────────────────────────┐
   │  Store in: data/stories/             │
   │  Format: {storyId}.json              │
   │  {                                   │
   │    id, originalFilename,             │
   │    textContent, status: 'uploaded'   │
   │  }                                   │
   └──────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────

2. EXTRACT STYLE (10-25% progress)
   ┌──────────────────────────────────────┐
   │  Gemini Pro Analyzes Story Text      │
   └──────────────────────────────────────┘
         │
         ↓
   ┌──────────────────────────────────────┐
   │  Extract:                            │
   │  • Characters                        │
   │    - Name                            │
   │    - Description                     │
   │    - Physical Traits                 │
   │  • Setting                           │
   │    - Location                        │
   │    - Time Period                     │
   │    - Atmosphere                      │
   │  • Visual Style                      │
   │    - Art Style                       │
   │    - Color Palette                   │
   │    - Cinematography                  │
   └──────────────────────────────────────┘
         │
         ↓
   ┌──────────────────────────────────────┐
   │  Save style info to story JSON       │
   │  data/stories/{storyId}.json         │
   │  {                                   │
   │    ...existing data,                 │
   │    styleInfo: { ... }                │
   │  }                                   │
   └──────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────

3. GENERATE SEGMENTS (25-40% progress)
   ┌──────────────────────────────────────┐
   │  Gemini Pro + Style Context          │
   │  Breaks story into 3-6 scenes        │
   └──────────────────────────────────────┘
         │
         ↓
   ┌──────────────────────────────────────┐
   │  For each segment:                   │
   │  • Scene Description                 │
   │  • Narration (story text)            │
   │  • Caption/Title                     │
   │  • Image Prompt (100-200 words)      │
   │    - Includes character details      │
   │    - Visual style context            │
   │    - Camera angles & lighting        │
   │    - Cinematic qualities             │
   │  • Duration (seconds)                │
   └──────────────────────────────────────┘
         │
         ↓
   ┌──────────────────────────────────────┐
   │  Update story JSON with segments     │
   │  {                                   │
   │    segments: [                       │
   │      {                               │
   │        id, sceneDescription,         │
   │        narration, caption,           │
   │        imagePrompt, duration,        │
   │        status: 'pending'             │
   │      }                               │
   │    ]                                 │
   │  }                                   │
   └──────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────

4. GENERATE VIDEOS (40-95% progress)
   
   For each segment (sequentially):
   
   ┌──────────────────────────────────────┐
   │  Segment N                           │
   │  status: 'generating'                │
   └──────────────────────────────────────┘
         │
         ↓
   ┌──────────────────────────────────────┐
   │  Gemini Veo 3 API Call               │
   │  Model: veo-3.0-generate-001         │
   │  {                                   │
   │    prompt: imagePrompt,              │
   │    duration: 10,                     │
   │    aspectRatio: '16:9',              │
   │    model: 'veo-3.0-generate-001'     │
   │  }                                   │
   └──────────────────────────────────────┘
         │
         ↓
   ┌──────────────────────────────────────┐
   │  Video Generated                     │
   │  Save to: data/videos/{storyId}/     │
   │  Filename: segment-{id}.mp4          │
   └──────────────────────────────────────┘
         │
         ↓
   ┌──────────────────────────────────────┐
   │  Update segment in story JSON        │
   │  {                                   │
   │    videoPath: '/path/to/video',      │
   │    videoUrl: '/api/videos/...',      │
   │    status: 'completed'               │
   │  }                                   │
   └──────────────────────────────────────┘

   Repeat for all segments...

────────────────────────────────────────────────────────────────────────

5. COMPLETION (100% progress)
   ┌──────────────────────────────────────┐
   │  Final Story JSON Structure          │
   │  data/stories/{storyId}.json         │
   │                                      │
   │  {                                   │
   │    id: 'uuid',                       │
   │    originalFilename: 'story.pdf',    │
   │    uploadedAt: '2025-10-04...',      │
   │    status: 'completed',              │
   │    progress: 100,                    │
   │    textContent: 'Once upon...',      │
   │    styleInfo: {                      │
   │      characters: [...],              │
   │      setting: {...},                 │
   │      visualStyle: {...}              │
   │    },                                │
   │    segments: [                       │
   │      {                               │
   │        id: 1,                        │
   │        sceneDescription: '...',      │
   │        narration: '...',             │
   │        caption: '...',               │
   │        imagePrompt: '...',           │
   │        videoPath: '/data/videos/...',│
   │        videoUrl: '/api/videos/...',  │
   │        duration: 10,                 │
   │        status: 'completed'           │
   │      },                              │
   │      ...                             │
   │    ]                                 │
   │  }                                   │
   └──────────────────────────────────────┘
```

## Directory Structure

```
backend/
└── data/
    ├── uploads/           # Original uploaded files
    │   └── {uuid}.pdf
    │
    ├── stories/           # Story metadata & segments (JSON)
    │   └── {storyId}.json
    │
    ├── videos/           # Generated videos
    │   └── {storyId}/
    │       ├── segment-1.mp4
    │       ├── segment-2.mp4
    │       └── segment-3.mp4
    │
    └── images/           # Optional thumbnails
        └── {storyId}/
            ├── segment-1.png
            └── segment-2.png
```

## API Endpoints Flow

### 1. Upload Story
```http
POST /api/upload
Content-Type: multipart/form-data

file: story.pdf
```

**Response:**
```json
{
  "success": true,
  "storyId": "uuid-here",
  "message": "File uploaded successfully. Processing started."
}
```

### 2. Check Processing Status
```http
GET /api/stories/{storyId}/status
```

**Response:**
```json
{
  "storyId": "uuid",
  "status": "generating_videos",
  "progress": 65,
  "currentStep": "Generating video 2 of 3...",
  "segments": [...]
}
```

### 3. Get Style Information
```http
GET /api/stories/{storyId}/style
```

**Response:**
```json
{
  "characters": [
    {
      "name": "Maya",
      "description": "Young adventurer",
      "physicalTraits": "20s, athletic build, long dark hair..."
    }
  ],
  "setting": {
    "location": "Small village near enchanted forest",
    "timeperiod": "Medieval fantasy",
    "atmosphere": "Whimsical, mysterious"
  },
  "visualStyle": {
    "artStyle": "Cinematic fantasy",
    "colorPalette": "Warm golden tones, deep forest greens",
    "cinematography": "Wide establishing shots, dynamic camera"
  }
}
```

### 4. Get Complete Story
```http
GET /api/stories/{storyId}
```

**Response:** Complete story JSON with all segments

### 5. Stream Video
```http
GET /api/videos/{storyId}/{segmentId}
```

Returns video stream with range support for playback

### 6. Download Video
```http
GET /api/videos/{storyId}/{segmentId}/download
```

Downloads segment video file

### 7. Regenerate Segment
```http
POST /api/stories/{storyId}/segments/{segmentId}/regenerate
Content-Type: application/json

{
  "prompt": "Optional new prompt to use"
}
```

## Processing States

1. `uploaded` - File uploaded, ready to process
2. `extracting_style` - Extracting characters, setting, style
3. `generating_segments` - Creating story segments
4. `generating_videos` - Generating videos with Veo 3
5. `completed` - All videos generated
6. `failed` - Processing error occurred

## Error Handling

- File validation errors return 400
- Processing errors update story status to 'failed'
- Individual segment failures mark segment as 'failed' but continue
- Videos can be regenerated individually

## Progress Tracking

- 0-5%: Upload
- 5-10%: Parse text
- 10-25%: Extract style
- 25-40%: Generate segments
- 40-95%: Generate videos (distributed across segments)
- 95-100%: Finalization

## Example Story JSON

```json
{
  "id": "abc-123-def",
  "originalFilename": "my-story.pdf",
  "uploadedAt": "2025-10-04T12:00:00Z",
  "status": "completed",
  "progress": 100,
  "currentStep": "All videos generated successfully!",
  "textContent": "Once upon a time in a small village...",
  "styleInfo": {
    "characters": [
      {
        "name": "Maya",
        "description": "A brave young adventurer setting out on her first quest",
        "physicalTraits": "Early 20s, athletic build, 5'6\", long flowing dark hair, bright green eyes, wearing practical leather travel clothing with a red cloak"
      }
    ],
    "setting": {
      "location": "Small medieval village on the edge of an enchanted forest",
      "timeperiod": "Medieval fantasy era",
      "atmosphere": "Whimsical and mysterious with elements of wonder and danger"
    },
    "visualStyle": {
      "artStyle": "Cinematic fantasy realism with painterly qualities",
      "colorPalette": "Warm golden morning light, deep forest greens, touches of magical purple and blue",
      "cinematography": "Wide establishing shots for scenes, medium close-ups for character moments, smooth tracking shots"
    }
  },
  "segments": [
    {
      "id": 1,
      "sceneDescription": "A peaceful morning in the village",
      "narration": "The sun rose gently over the quiet village, painting the sky in shades of gold and pink.",
      "caption": "Chapter 1: A New Beginning",
      "imagePrompt": "Cinematic wide shot of a quaint medieval village at sunrise. Golden morning light bathes cobblestone streets and thatched-roof cottages. Camera slowly pans across the peaceful scene. Warm color palette with golden yellows, soft oranges, and gentle pinks in the sky. Smoke rises from chimneys. Dew glistens on grass. Style: fantasy realism with painterly quality. Soft focus background, detailed foreground. Atmospheric haze. Duration: 10 seconds. Camera movement: slow left-to-right pan.",
      "videoPath": "/Users/wesleylu/Desktop/story-to-scene-magic-08/backend/data/videos/abc-123-def/segment-1.mp4",
      "videoUrl": "/api/videos/abc-123-def/1",
      "duration": 10,
      "status": "completed"
    }
  ]
}
```


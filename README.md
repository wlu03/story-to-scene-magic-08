```markdown
# Story-to-Scene: children's books → educational interactive movies

Story-to-Scene transforms children's books into interactive, educational movie experiences. Feed the app a book (plain text, EPUB or a simple story file) and it analyzes sections, generates visuals and audio, assembles short scene-based videos, and layers interactive learning elements (questions, vocabulary highlights, narration controls) to create an engaging learning movie for kids.

## Goals

- Convert static children's books into short, scene-based interactive movies.
- Provide scaffolded educational content: comprehension checks, vocabulary prompts, and optional tracking for teachers/parents.
- Make media generation reproducible and extensible (replaceable image/audio backends).

## Key features

- Story parsing: split a book into scenes/shots with speaker/dialog and scene descriptions.
- Image generation per scene (configurable prompts and styles).
- Audio narration and simple TTS/audio stitching for scenes.
- Video assembly to produce short, shareable movie segments.
- Interactive overlays: multiple-choice questions, word highlights, playback controls.
- Persistence and uploads: store generated media and story artifacts for later playback or editing.

## Repository layout (high level)

- backend/ — Node backend services that handle parsing, media generation, and storage.
	- src/ — server source code (routes, services, processors, sample data)
	- data/ — sample stories, images, videos, and uploads used by the backend
- src/ — frontend app (Vite + React + TypeScript)
	- components/ — UI pieces (upload, processing view, storyboard viewer)
	- integrations/ — optional integrations (e.g., Supabase)

## Quickstart (local development)

Requirements: Node.js 16+ and npm (or pnpm/yarn).

1. Clone the repository

```powershell
git clone <YOUR_GIT_URL>
cd story-to-scene-magic-08
```

2. Install dependencies

```powershell
npm install
```

3. Start the frontend dev server

```powershell
npm run dev
```

4. Start the backend (from the `backend/` folder) in a separate terminal if you plan to use local media endpoints

```powershell
cd backend
npm install
npm run dev
```

Notes:
- The backend includes sample story files in `backend/data/sample-story/` and example media in `backend/data/images/` and `backend/data/videos/`.
- Many media-generation hooks are implemented as services under `backend/src/services`. You can swap them for other providers or local stubs.

## How it works (brief)

1. Upload or select a book. The parser extracts scenes, characters and descriptive prompts.
2. For each scene, the image generator produces one or more key frames.
3. TTS or provided audio is attached per scene, then scenes are stitched into short videos.
4. The frontend renders a storyboard with interactive learning widgets (quiz, vocabulary) synchronized to playback.

## Configuration & integrations

- Replace or configure image/audio backends in `backend/src/services/`.
- Optional persistent storage integrations (Supabase, S3, or local file storage) are supported in `backend/src/utils/fileStorage.ts` and `src/integrations/`.

## Technologies

- Frontend: Vite, React, TypeScript, Tailwind CSS
- Backend: Node.js + TypeScript
- Optional: Supabase for storage/auth, external image/audio generation APIs

## Contributing

- Want to add a learning widget or swap the image generator? Open an issue or a PR.
- Follow existing code style and add tests for new processing logic in `backend/src/services`.

## License

This repository does not include a license file by default — add one (for example, MIT) if you plan to open-source this project.

```

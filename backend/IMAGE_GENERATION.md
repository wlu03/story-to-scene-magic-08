# Reference Image Generation

## Overview

The backend supports generating reference images for visual consistency across video segments. This feature uses Google's **Imagen 3** model to create character reference sheets based on extracted style information.

## Current Status

**⚠️ DISABLED BY DEFAULT**

Reference image generation is currently disabled because it requires **Google Cloud Vertex AI** setup, which is separate from the standard Gemini API.

## Why It's Disabled

- Imagen models are not available through the standard `@google/genai` API
- Requires Google Cloud Project with Vertex AI enabled
- Needs service account authentication
- Different SDK/setup process

## How It Works (When Enabled)

1. After extracting style info (characters, setting, visual style)
2. Creates a detailed prompt for a character reference sheet
3. Generates image using Imagen 3
4. Saves image locally
5. Converts image to base64
6. Passes image to **every Veo 3 video generation call** as visual context
7. Ensures consistent character appearance across all segments

## Current Workaround

The system works **perfectly without reference images** by:
- Using detailed text-based style context in every video prompt
- Including character descriptions, visual style, and setting info
- Veo 3 maintains consistency from these detailed prompts

## How to Enable (Advanced)

If you want to enable image generation, you need to:

### 1. Set Up Vertex AI

```bash
# Enable Vertex AI API in Google Cloud Console
gcloud services enable aiplatform.googleapis.com

# Set up application default credentials
gcloud auth application-default login
```

### 2. Update Environment Variables

Add to your `.env` file:

```bash
# Enable reference image generation
ENABLE_REFERENCE_IMAGES=true

# You may need to set GCP project ID
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
```

### 3. Update Code to Use Vertex AI SDK

The current implementation uses `@google/genai` which doesn't support Imagen. You'll need to:

```bash
# Install Vertex AI SDK
npm install @google-cloud/aiplatform
```

Then update `imageGenerator.ts` to use the Vertex AI SDK instead.

### 4. Alternative: Use Different SDK

```bash
# Google Cloud Vertex AI SDK
npm install @google-cloud/vertexai
```

See: https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview

## Benefits When Enabled

✅ **Visual Consistency**: All segments use the same character reference  
✅ **Better Quality**: Image-to-video often produces more consistent results  
✅ **Style Adherence**: Characters look identical across all segments  

## Drawbacks

⚠️ **Complex Setup**: Requires GCP project and Vertex AI  
⚠️ **Extra Cost**: Imagen API calls cost money  
⚠️ **Longer Processing**: Adds 10-30s per story for image generation  

## Current Performance

Without reference images, the system:
- ✅ Generates videos successfully with Veo 3
- ✅ Maintains style through detailed text prompts
- ✅ No GCP/Vertex AI setup required
- ✅ Faster processing (no image generation step)
- ⚠️ May have slight character variation between segments

## Recommendation

**For most users**: Keep it disabled. The text-based approach works great.

**For production at scale**: Enable it if you need perfect visual consistency and are willing to set up Vertex AI.

## Related Files

- `backend/src/services/imageGenerator.ts` - Image generation service
- `backend/src/services/processor.ts` - Uses images when available
- `backend/src/config/index.ts` - Feature flag configuration


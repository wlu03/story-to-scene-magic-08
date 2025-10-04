import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { config, validateConfig } from '@/config';
import { fileStorage } from '@/utils/fileStorage';
import uploadRoutes from '@/routes/upload';
import storiesRoutes from '@/routes/stories';
import videosRoutes from '@/routes/videos';
import imagesRoutes from '@/routes/images';

// Initialize Express app
const app: Express = express();

// Middleware
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api', uploadRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/images', imagesRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Validate configuration
    validateConfig();
    console.log('✓ Configuration validated');

    // Initialize storage
    await fileStorage.initializeStorage();
    console.log('✓ Storage initialized');

    // Start listening
    app.listen(config.port, () => {
      console.log(`\n🚀 Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🎬 Gemini Veo Model: ${config.veo.model}`);
      console.log(`📁 Data directory: ${config.storage.dataDir}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();


import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import mongoose from "mongoose";
import swaggerUi from 'swagger-ui-express';
import swaggerDefinition from './config/swagger.js';
import { createServer } from 'http';
import { exec } from 'child_process';
import { initSocket, getIO, isIOInitialized } from './config/socket.js';
import { logRequest, logger } from './utils/logger.js';
import { NotificationService } from './services/notificationServices.js';
import { errorHandler } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import messageRoutes from './routes/messages.js';
import connectionRoutes from './routes/connections.js';
import storiesRoutes from './routes/stories.js';
import uploadRoutes from './routes/upload.js';
import inngestRoutes from './routes/inngest.js';

// 1. Load environment variables and connect to DB
dotenv.config();
connectDB();

// 2. Initialize express app FIRST so 'app' exists before configuring it
const app = express();

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. CORS Configuration setup
// Allow localhost on any port for development (Vite cycles through 5173-5176)
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl or postman)
        if (!origin) return callback(null, true);
        
        // In development, allow any localhost origin (Vite uses different ports)
        if (process.env.NODE_ENV !== 'production') {
            if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
                return callback(null, true);
            }
        }
        
        // In production, check against allowed origins
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          'https://dev-threads-3.onrender.com',
          'https://dev-threads-jybl.onrender.com',
          'http://localhost:5173'
        ].filter(Boolean);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true, // Allow cookies to be sent with requests
}));

// 4. Body parser middleware to parse JSON/URL bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded media files statically at /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. SWAGGER UI SETUP ✅ BEFORE ROUTES
// Configure Swagger UI with proper options
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDefinition, {
  swaggerOptions: {
    url: '/api-docs.json',
    displayOperationId: true,
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    persistAuthorization: true,
    displayRequestDuration: true,
    showExtensions: true
  },
  customCss: '.swagger-ui { max-width: 100%; }',
  customSiteTitle: 'Social Media App - API Documentation'
}));

// Serve swagger definition as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDefinition);
});

// 6. Define HTTP server and Socket.IO bindings *after* app initialization
const httpServer = createServer(app);
initSocket(httpServer);
// Make Socket.IO instance available globally for legacy modules
try {
  global.io = getIO();
} catch (err) {
  console.warn('Could not assign global.io:', err.message);
}

// 7. Test route / Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    socket: isIOInitialized() ? 'connected' : 'idle',
    features: {
      messaging: true,
      mediaUpload: true,
      realTimeSocket: isIOInitialized(),
      calling: true
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    backend: 'running',
    socket: isIOInitialized() ? 'connected' : 'idle',
    timestamp: new Date().toISOString()
  });
});

// 8. Route attachments
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/media', uploadRoutes);
app.use('/api', inngestRoutes);

// 9. Error handling middleware
// Capture malformed JSON body-parser errors early and return 400
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn('Invalid JSON payload received', { message: err.message });
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// Generic error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Internal server error' });
});

// 10. 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// 11. Start Server with robust error handling
const PORT = Number(process.env.PORT || 5234);

httpServer.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use (EADDRINUSE).`);
    // Attempt to show which process is using the port (Windows / PowerShell)
    exec(`netstat -ano | findstr :${PORT}`, (execErr, stdout, stderr) => {
      if (execErr) {
        console.error('Could not execute netstat to find process using port:', execErr.message || execErr);
      } else {
        console.error(`Port ${PORT} usage:\n${stdout || stderr}`);
      }
      process.exit(1);
    });
  } else {
    console.error('HTTP server error:', err);
    process.exit(1);
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
});

// Global process handlers for better diagnostics
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err && err.stack ? err.stack : err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

export { getIO, app };
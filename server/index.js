const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

// Load environment variables from .env file located one level up
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import routes
const geminiRouter = require('./api/gemini');
const generateRouter = require('./api/generate');
const imagesRouter = require('./api/images');

// Create Express app
const app = express();
const BASE_PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', geminiRouter);
app.use('/api', generateRouter);
app.use('/api', imagesRouter);

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server with automatic port fallback
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Server URL: http://localhost:${port}/`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is in use. Trying port ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    throw error;
  });
}

startServer(BASE_PORT);
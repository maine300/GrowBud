import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();

// Basic JSON and URL parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple API endpoint for testing
app.get('/api/test', (req, res) => {
  res.json({ status: 'Server is working!', timestamp: new Date() });
});

// Serve static files from dist/public if it exists
const publicPath = path.join(process.cwd(), 'dist', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Fallback to serve from client directory
const clientPath = path.join(process.cwd(), 'client');
if (fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));
}

// Catch-all handler
app.get('*', (req, res) => {
  const indexPath = fs.existsSync(path.join(publicPath, 'index.html')) 
    ? path.join(publicPath, 'index.html')
    : path.join(clientPath, 'index.html');
    
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('<h1>Plant Monitoring System</h1><p>Setting up your app...</p>');
  }
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🌱 Plant Monitoring Server running on port ${port}`);
  console.log(`📱 Access your app at: http://localhost:${port}`);
});
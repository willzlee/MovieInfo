const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage for comments
const movieComments = new Map();

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes for React frontend
app.get('/api/search', async (req, res) => {
  const searchQuery = req.query.query;
  
  if (!searchQuery) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const apiKey = process.env.OMDB_API_KEY;
    const response = await axios.get(`https://www.omdbapi.com/?s=${encodeURIComponent(searchQuery)}&apikey=${apiKey}`);
    
    if (response.data.Response === 'False') {
      return res.json({ 
        error: response.data.Error || 'No results found'
      });
    }

    res.json({ 
      movies: response.data.Search
    });

  } catch (error) {
    console.error('Error fetching data from OMDB API:', error);
    res.status(500).json({ 
      error: 'Error connecting to the movie database. Please try again later.'
    });
  }
});

app.get('/api/movie/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const apiKey = process.env.OMDB_API_KEY;
    const response = await axios.get(`https://www.omdbapi.com/?i=${movieId}&plot=full&apikey=${apiKey}`);
    
    if (response.data.Response === 'False') {
      return res.json({ 
        error: response.data.Error || 'Movie not found'
      });
    }

    // Get comments for this movie or create empty array if none exist
    const comments = movieComments.get(movieId) || [];

    res.json({ 
      movie: response.data,
      comments: comments
    });

  } catch (error) {
    console.error('Error fetching movie data from OMDB API:', error);
    res.status(500).json({ 
      error: 'Error connecting to the movie database. Please try again later.'
    });
  }
});

// Comment API Routes
app.post('/api/comments/:movieId', (req, res) => {
  const { movieId } = req.params;
  const { name, comment } = req.body;
  
  if (!name || !comment) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name and comment are required'
    });
  }

  // Get existing comments or create new array
  const comments = movieComments.get(movieId) || [];
  
  // Add new comment with timestamp
  const newComment = {
    id: Date.now().toString(), // simple unique ID
    name,
    comment,
    timestamp: new Date()
  };
  
  comments.unshift(newComment); // Add to beginning of array
  
  // Save back to our storage
  movieComments.set(movieId, comments);
  
  res.status(201).json({ 
    success: true, 
    comment: newComment 
  });
});

app.delete('/api/comments/:movieId/:commentId', (req, res) => {
  const { movieId, commentId } = req.params;
  
  // Get existing comments
  const comments = movieComments.get(movieId);
  
  // If no comments for this movie
  if (!comments) {
    return res.status(404).json({ 
      success: false, 
      message: 'No comments found for this movie' 
    });
  }
  
  // Find the index of the comment to delete
  const commentIndex = comments.findIndex(c => c.id === commentId);
  
  // If comment not found
  if (commentIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Comment not found' 
    });
  }
  
  // Remove the comment
  comments.splice(commentIndex, 1);
  
  // Save the updated comments
  movieComments.set(movieId, comments);
  
  res.json({ 
    success: true, 
    message: 'Comment deleted successfully' 
  });
});

// Serve React app for all other routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});

app.get('/movie/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage for comments
const movieComments = new Map();

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Movie Information App',
    movies: null,
    error: null
  });
});

app.get('/search', async (req, res) => {
  const searchQuery = req.query.search;
  
  if (!searchQuery) {
    return res.redirect('/');
  }

  try {
    const apiKey = process.env.OMDB_API_KEY;
    const response = await axios.get(`https://www.omdbapi.com/?s=${encodeURIComponent(searchQuery)}&apikey=${apiKey}`);
    
    if (response.data.Response === 'False') {
      return res.render('index', { 
        title: 'Movie Information App',
        movies: null,
        error: response.data.Error || 'No results found'
      });
    }

    res.render('index', { 
      title: 'Movie Information App',
      movies: response.data.Search,
      error: null
    });

  } catch (error) {
    console.error('Error fetching data from OMDB API:', error);
    res.render('index', { 
      title: 'Movie Information App',
      movies: null,
      error: 'Error connecting to the movie database. Please try again later.'
    });
  }
});

app.get('/movie/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const apiKey = process.env.OMDB_API_KEY;
    const response = await axios.get(`https://www.omdbapi.com/?i=${movieId}&plot=full&apikey=${apiKey}`);
    
    if (response.data.Response === 'False') {
      return res.render('movie', { 
        title: 'Movie Not Found',
        movie: null,
        comments: [],
        error: response.data.Error || 'Movie not found'
      });
    }

    // Get comments for this movie or create empty array if none exist
    const comments = movieComments.get(movieId) || [];

    res.render('movie', { 
      title: `${response.data.Title} (${response.data.Year})`,
      movie: response.data,
      comments: comments,
      error: null
    });

  } catch (error) {
    console.error('Error fetching movie data from OMDB API:', error);
    res.render('movie', { 
      title: 'Movie Details',
      movie: null,
      comments: [],
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

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
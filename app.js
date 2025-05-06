const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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
        error: response.data.Error || 'Movie not found'
      });
    }

    res.render('movie', { 
      title: `${response.data.Title} (${response.data.Year})`,
      movie: response.data,
      error: null
    });

  } catch (error) {
    console.error('Error fetching movie data from OMDB API:', error);
    res.render('movie', { 
      title: 'Movie Details',
      movie: null,
      error: 'Error connecting to the movie database. Please try again later.'
    });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
import React, { useState, useEffect } from 'react';
import { Home } from '../pages/Home';
import { MovieDetails } from '../pages/MovieDetails';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  // Store last search results in state
  const [lastSearch, setLastSearch] = useState(() => {
    const savedSearch = sessionStorage.getItem('lastSearch');
    return savedSearch ? JSON.parse(savedSearch) : null;
  });

  // Handle navigation to movie detail
  const navigateToMovie = (movieId) => {
    setSelectedMovieId(movieId);
    setCurrentPage('movie');
    window.scrollTo(0, 0);
  };

  // Handle navigation back to home
  const navigateToHome = () => {
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  // Save search results to state and session storage
  const handleSearchResults = (query, results) => {
    const searchData = { query, results };
    setLastSearch(searchData);
    sessionStorage.setItem('lastSearch', JSON.stringify(searchData));
  };

  return (
    <div className="container">
      <header>
        <h1>Movie Information App</h1>
        <p>Search for movies, TV shows, and more</p>
      </header>

      {currentPage === 'home' ? (
        <Home 
          onMovieSelect={navigateToMovie} 
          lastSearch={lastSearch}
          onSearchResults={handleSearchResults}
        />
      ) : (
        <MovieDetails 
          movieId={selectedMovieId} 
          onBackClick={navigateToHome} 
        />
      )}

      <footer>
        <p>Data provided by <a href="https://www.omdbapi.com/" target="_blank">OMDb API</a></p>
      </footer>
    </div>
  );
};

export default App;
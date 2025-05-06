import React, { useState } from 'react';
import { MovieCard } from '../components/MovieCard';
import { SearchForm } from '../components/SearchForm';

export const Home = ({ onMovieSelect, lastSearch, onSearchResults }) => {
  const [movies, setMovies] = useState(lastSearch ? lastSearch.results : null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // The API endpoint is /api/search for our Express backend
      const response = await fetch(`http://localhost:5009/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setMovies(null);
        onSearchResults(searchQuery, null);
      } else {
        setMovies(data.movies);
        onSearchResults(searchQuery, data.movies);
      }
    } catch (err) {
      console.error('Error searching movies:', err);
      setError('Error connecting to the movie database. Please try again later.');
      setMovies(null);
      onSearchResults(searchQuery, null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SearchForm onSearch={handleSearch} initialQuery={lastSearch ? lastSearch.query : ''} />
      
      {isLoading && (
        <div className="loading">
          <p>Loading results...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {movies && movies.length > 0 && (
        <section className="results-section">
          <h2>Search Results</h2>
          <div className="movie-grid">
            {movies.map(movie => (
              <MovieCard 
                key={movie.imdbID}
                movie={movie}
                onClick={() => onMovieSelect(movie.imdbID)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
};
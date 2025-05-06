import React, { useState, useEffect } from 'react';
import { Comments } from '../components/Comments';

export const MovieDetails = ({ movieId, onBackClick }) => {
  const [movie, setMovie] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch movie details
  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await fetch(`/api/movie/${movieId}`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setMovie(data.movie);
          setComments(data.comments || []);
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Error connecting to the movie database. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  // Handle adding a new comment
  const handleAddComment = (newComment) => {
    setComments(prevComments => [newComment, ...prevComments]);
  };

  // Handle deleting a comment
  const handleDeleteComment = (commentId) => {
    setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
  };

  if (isLoading) {
    return <div className="loading">Loading movie details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onBackClick} className="back-button">Back to Search</button>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="not-found">
        <h2>Movie Not Found</h2>
        <p>The requested movie could not be found.</p>
        <button onClick={onBackClick} className="back-button">Back to Search</button>
      </div>
    );
  }

  return (
    <div className="movie-details-container">
      <button onClick={onBackClick} className="back-button">← Back to Search</button>
      
      <div className="movie-details">
        <div className="movie-header">
          <h2>{movie.Title} <span className="year">({movie.Year})</span></h2>
          <div className="movie-meta">
            {movie.Rated && <span>{movie.Rated}</span>}
            {movie.Runtime && <span>{movie.Runtime}</span>}
            {movie.Genre && <span>{movie.Genre}</span>}
            {movie.Released && <span>Released: {movie.Released}</span>}
          </div>
        </div>
        
        <div className="movie-content">
          <div className="movie-poster">
            {movie.Poster && movie.Poster !== 'N/A' ? (
              <img src={movie.Poster} alt={`${movie.Title} poster`} />
            ) : (
              <div className="no-poster">No Poster Available</div>
            )}
            
            {movie.Ratings && movie.Ratings.length > 0 && (
              <div className="ratings">
                <h3>Ratings</h3>
                <ul>
                  {movie.Ratings.map((rating, index) => (
                    <li key={index}>
                      <span className="rating-source">{rating.Source}:</span> {rating.Value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="movie-info-detailed">
            {movie.Plot && (
              <div className="plot">
                <h3>Plot</h3>
                <p>{movie.Plot}</p>
              </div>
            )}
            
            <div className="movie-credits">
              {movie.Director && movie.Director !== 'N/A' && (
                <div>
                  <h3>Director</h3>
                  <p>{movie.Director}</p>
                </div>
              )}
              
              {movie.Writer && movie.Writer !== 'N/A' && (
                <div>
                  <h3>Writer</h3>
                  <p>{movie.Writer}</p>
                </div>
              )}
              
              {movie.Actors && movie.Actors !== 'N/A' && (
                <div>
                  <h3>Actors</h3>
                  <p>{movie.Actors}</p>
                </div>
              )}
            </div>
            
            <div className="additional-info">
              {movie.Language && movie.Language !== 'N/A' && (
                <div>
                  <h3>Language</h3>
                  <p>{movie.Language}</p>
                </div>
              )}
              
              {movie.Country && movie.Country !== 'N/A' && (
                <div>
                  <h3>Country</h3>
                  <p>{movie.Country}</p>
                </div>
              )}
              
              {movie.Awards && movie.Awards !== 'N/A' && (
                <div>
                  <h3>Awards</h3>
                  <p>{movie.Awards}</p>
                </div>
              )}
              
              {movie.BoxOffice && movie.BoxOffice !== 'N/A' && (
                <div>
                  <h3>Box Office</h3>
                  <p>{movie.BoxOffice}</p>
                </div>
              )}
            </div>
            
            {movie.imdbID && (
              <div className="external-links">
                <a href={`https://www.imdb.com/title/${movie.imdbID}`} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="imdb-link">
                  View on IMDb
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Comments 
        movieId={movieId}
        comments={comments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />
    </div>
  );
};
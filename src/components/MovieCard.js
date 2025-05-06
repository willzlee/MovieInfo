import React from 'react';

export const MovieCard = ({ movie, onClick }) => {
  return (
    <div className="movie-card" onClick={onClick}>
      <div className="movie-card-inner">
        {movie.Poster && movie.Poster !== 'N/A' ? (
          <img src={movie.Poster} alt={`${movie.Title} poster`} />
        ) : (
          <div className="no-poster">No Poster Available</div>
        )}
        <div className="movie-info">
          <h3>{movie.Title}</h3>
          <p>{movie.Year}</p>
          <span className="movie-type">{movie.Type}</span>
        </div>
      </div>
    </div>
  );
};
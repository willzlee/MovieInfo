import React, { useState } from 'react';

export const SearchForm = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <section className="search-section">
      <form onSubmit={handleSubmit}>
        <div className="search-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a movie..."
            required
          />
          <button type="submit">Search</button>
        </div>
      </form>
    </section>
  );
};
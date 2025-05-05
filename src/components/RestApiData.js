import React, { useState, useEffect } from 'react';

// This component demonstrates fetching data via REST API after streaming ends or when needed
const RestApiData = ({ streamingActive }) => {
  const [restData, setRestData] = useState([]);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limit, setLimit] = useState(10);
  
  // Function to fetch data from REST API
  const fetchDataFromRest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build URL with query parameters
      let url = '/api/data';
      const params = new URLSearchParams();
      
      if (limit) {
        params.append('limit', limit);
      }
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      // Add timestamp parameter if we're fetching data after a certain time
      if (lastFetchTime) {
        params.append('after', lastFetchTime);
      }
      
      // Add query parameters to URL if there are any
      if ([...params.entries()].length > 0) {
        url += `?${params.toString()}`;
      }
      
      // Make the request
      const response = await fetch(url);
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status} ${response.statusText}`);
      }
      
      // Parse JSON response
      const result = await response.json();
      
      // Update state with fetched data
      setRestData(result.data);
      setLastFetchTime(new Date().toISOString());
      
      console.log(`Successfully fetched ${result.data.length} data points from REST API`);
    } catch (err) {
      console.error('Error fetching data from REST API:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data when streaming is no longer active
  useEffect(() => {
    if (!streamingActive) {
      console.log('Streaming ended or inactive, fetching data from REST API');
      fetchDataFromRest();
    }
  }, [streamingActive]);
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2>REST API Data Fetch</h2>
        <div>
          <label>
            Category: 
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ marginLeft: '5px', padding: '5px' }}
            >
              <option value="">All Categories</option>
              <option value="Category A">Category A</option>
              <option value="Category B">Category B</option>
              <option value="Category C">Category C</option>
              <option value="Category D">Category D</option>
            </select>
          </label>
          
          <label style={{ marginLeft: '15px' }}>
            Limit: 
            <input 
              type="number" 
              value={limit} 
              onChange={(e) => setLimit(e.target.value)} 
              min="1" 
              max="100"
              style={{ marginLeft: '5px', width: '60px', padding: '5px' }}
            />
          </label>
          
          <button 
            onClick={fetchDataFromRest} 
            disabled={loading}
            style={{ marginLeft: '15px' }}
          >
            {loading ? 'Loading...' : 'Fetch Data'}
          </button>
        </div>
      </div>
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          Error: {error}
        </div>
      )}
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Label</th>
              <th style={tableHeaderStyle}>Value</th>
              <th style={tableHeaderStyle}>Category</th>
              <th style={tableHeaderStyle}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {restData.map(point => (
              <tr key={point.id}>
                <td style={tableCellStyle}>{point.label}</td>
                <td style={tableCellStyle}>{point.value}</td>
                <td style={tableCellStyle}>{point.category}</td>
                <td style={tableCellStyle}>
                  {new Date(point.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {restData.length === 0 && !loading && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                  No data available. {!streamingActive ? 'Try fetching data manually.' : 'Data will be fetched when streaming ends.'}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                  Loading data...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {lastFetchTime && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px', textAlign: 'right' }}>
          Last fetched: {new Date(lastFetchTime).toLocaleString()}
        </div>
      )}
    </div>
  );
};

const tableHeaderStyle = {
  backgroundColor: '#f2f2f2',
  padding: '12px 15px',
  textAlign: 'left',
  borderBottom: '1px solid #ddd'
};

const tableCellStyle = {
  padding: '12px 15px',
  borderBottom: '1px solid #ddd'
};

export default RestApiData;
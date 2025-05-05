import React from 'react';

const DataTable = ({ data }) => {
  // Sort data by timestamp, newest first
  const sortedData = [...data].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="chart-container">
      <h2>Data Points</h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Label</th>
              <th style={tableHeaderStyle}>Value</th>
              <th style={tableHeaderStyle}>Category</th>
              <th style={tableHeaderStyle}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map(point => (
              <tr key={point.id}>
                <td style={tableCellStyle}>{point.label}</td>
                <td style={tableCellStyle}>{point.value}</td>
                <td style={tableCellStyle}>{point.category}</td>
                <td style={tableCellStyle}>
                  {new Date(point.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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

export default DataTable;
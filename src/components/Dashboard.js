import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_DATA_POINTS } from '../graphql/queries';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import DataTable from './DataTable';
import DataSubscription from './DataSubscription';
import AddDataForm from './AddDataForm';
import RestApiData from './RestApiData';

const Dashboard = () => {
  const [selectedChart, setSelectedChart] = useState('bar');
  const [streamingActive, setStreamingActive] = useState(true);
  const [streamingTimeLeft, setStreamingTimeLeft] = useState(30); // 30 seconds of streaming by default
  const { loading, error, data } = useQuery(GET_DATA_POINTS);
  
  const toggleChart = () => {
    setSelectedChart(selectedChart === 'bar' ? 'line' : 'bar');
  };

  const toggleStreaming = () => {
    setStreamingActive(prevState => !prevState);
    if (!streamingActive) {
      // Reset timer when restarting streaming
      setStreamingTimeLeft(30);
    }
  };
  
  // Countdown timer to simulate streaming end
  useEffect(() => {
    let timer;
    if (streamingActive && streamingTimeLeft > 0) {
      timer = setInterval(() => {
        setStreamingTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (streamingTimeLeft === 0) {
      setStreamingActive(false);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [streamingActive, streamingTimeLeft]);
  
  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error loading data: {error.message}</p>;
  
  const dataPoints = data?.getDataPoints || [];
  
  return (
    <>
      <DataSubscription streamingActive={streamingActive} />
      
      <div className="chart-container">
        <div className="chart-header">
          <div>
            <h2>Real-Time Data</h2>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
              <div 
                style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  backgroundColor: streamingActive ? '#4CAF50' : '#F44336',
                  marginRight: '8px'
                }} 
              />
              <span style={{ fontSize: '14px' }}>
                {streamingActive 
                  ? `Streaming active (${streamingTimeLeft}s remaining)` 
                  : 'Streaming ended'}
              </span>
              <button 
                onClick={toggleStreaming} 
                style={{ 
                  marginLeft: '10px', 
                  padding: '3px 8px', 
                  fontSize: '12px'
                }}
              >
                {streamingActive ? 'End Streaming' : 'Restart Streaming'}
              </button>
            </div>
          </div>
          <button onClick={toggleChart}>
            Switch to {selectedChart === 'bar' ? 'Line' : 'Bar'} Chart
          </button>
        </div>
        
        <div className="chart">
          {selectedChart === 'bar' ? (
            <BarChart data={dataPoints} />
          ) : (
            <LineChart data={dataPoints} />
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <AddDataForm />
        </div>
        <div style={{ flex: '2', minWidth: '500px' }}>
          <DataTable data={dataPoints} />
        </div>
      </div>
      
      {/* REST API Data section */}
      <RestApiData streamingActive={streamingActive} />
    </>
  );
};

export default Dashboard;
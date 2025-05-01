import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_DATA_POINTS } from '../graphql/queries';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import DataTable from './DataTable';
import DataSubscription from './DataSubscription';
import AddDataForm from './AddDataForm';

const Dashboard = () => {
  const [selectedChart, setSelectedChart] = useState('bar');
  const { loading, error, data } = useQuery(GET_DATA_POINTS);
  
  const toggleChart = () => {
    setSelectedChart(selectedChart === 'bar' ? 'line' : 'bar');
  };
  
  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error loading data: {error.message}</p>;
  
  const dataPoints = data?.getDataPoints || [];
  
  return (
    <>
      <DataSubscription />
      
      <div className="chart-container">
        <div className="chart-header">
          <h2>Real-Time Data</h2>
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
    </>
  );
};

export default Dashboard;
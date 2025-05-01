import { useEffect } from 'react';
import { useSubscription, useApolloClient } from '@apollo/client';
import { DATA_POINT_ADDED_SUBSCRIPTION, GET_DATA_POINTS } from '../graphql/queries';

// This component doesn't render anything visible but handles the subscription
// and updates the Apollo cache when new data arrives
const DataSubscription = () => {
  const { data, loading, error } = useSubscription(DATA_POINT_ADDED_SUBSCRIPTION);
  const client = useApolloClient();
  
  useEffect(() => {
    if (data && data.dataPointAdded) {
      console.log('New data received via subscription:', data.dataPointAdded);
      
      // Update the cache with the new data point
      const currentData = client.readQuery({ query: GET_DATA_POINTS });
      
      if (currentData && currentData.getDataPoints) {
        client.writeQuery({
          query: GET_DATA_POINTS,
          data: {
            getDataPoints: [
              ...currentData.getDataPoints, 
              data.dataPointAdded
            ]
          }
        });
      }
    }
    
    if (error) {
      console.error('Subscription error:', error);
    }
  }, [data, error, client]);
  
  return null; // This component doesn't render anything
};

export default DataSubscription;
import { useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { DATA_POINT_ADDED_SUBSCRIPTION } from '../graphql/queries';

// This component doesn't render anything visible but handles the subscription
// and updates the Apollo cache when new data arrives
const DataSubscription = () => {
  const { data, loading, error } = useSubscription(DATA_POINT_ADDED_SUBSCRIPTION);
  
  useEffect(() => {
    if (data && data.dataPointAdded) {
      console.log('New data received via subscription:', data.dataPointAdded);
    }
    
    if (error) {
      console.error('Subscription error:', error);
    }
  }, [data, error]);
  
  return null; // This component doesn't render anything
};

export default DataSubscription;
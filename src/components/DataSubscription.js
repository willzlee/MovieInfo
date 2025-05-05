import { useEffect, useState, useRef } from 'react';
import { useApolloClient } from '@apollo/client';
import { DATA_POINT_ADDED_SUBSCRIPTION, GET_DATA_POINTS } from '../graphql/queries';

// This component doesn't render anything visible but handles the subscription
// and updates the Apollo cache when new data arrives
const DataSubscription = ({ streamingActive = true }) => {
  const [isConnected, setIsConnected] = useState(false);
  const client = useApolloClient();
  const socketRef = useRef(null);
  
  useEffect(() => {
    let socket = null;

    // Initialize WebSocket connection if streaming is active
    if (streamingActive) {
      // Get the host from the current window location
      const getWebSocketUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/graphql`;
      };
      
      // Create WebSocket connection
      socket = new WebSocket(getWebSocketUrl());
      socketRef.current = socket;
      console.log('Attempting to connect to WebSocket...');
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        
        // Initialize connection
        socket.send(JSON.stringify({
          type: 'connection_init',
          payload: {}
        }));
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message.type);
          
          // Handle connection acknowledgment
          if (message.type === 'connection_ack') {
            console.log('Connection acknowledged, subscribing to data points');
            
            // Subscribe to dataPointAdded
            socket.send(JSON.stringify({
              id: '1',
              type: 'subscribe',
              payload: {
                query: DATA_POINT_ADDED_SUBSCRIPTION.loc.source.body
              }
            }));
          }
          
          // Handle subscription data
          if (message.type === 'next' && message.payload && message.payload.data) {
            const newDataPoint = message.payload.data.dataPointAdded;
            console.log('New data received via subscription:', newDataPoint);
            
            // Update the cache with the new data point
            try {
              const currentData = client.readQuery({ query: GET_DATA_POINTS });
              
              if (currentData && currentData.getDataPoints) {
                client.writeQuery({
                  query: GET_DATA_POINTS,
                  data: {
                    getDataPoints: [
                      ...currentData.getDataPoints, 
                      newDataPoint
                    ]
                  }
                });
              }
            } catch (error) {
              console.error('Error updating cache:', error);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
      };
    } else if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Close the connection if streaming is not active anymore
      console.log('Streaming ended, closing WebSocket connection');
      socketRef.current.close();
      setIsConnected(false);
    }
    
    // Clean up on unmount or when streaming state changes
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('Cleaning up WebSocket connection');
        socket.close();
      }
    };
  }, [client, streamingActive]);
  
  return null; // This component doesn't render anything
};

export default DataSubscription;
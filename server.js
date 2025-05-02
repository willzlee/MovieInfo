const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
const { PubSub } = require('graphql-subscriptions');

// Create a new PubSub instance for handling GraphQL subscriptions
const pubsub = new PubSub();

// In-memory data store
let dataPoints = [];
let nextId = 1;

// Constants
const DATA_POINT_ADDED = 'DATA_POINT_ADDED';

// Define GraphQL schema
const typeDefs = `
  type DataPoint {
    id: ID!
    value: Float!
    label: String!
    timestamp: String!
    category: String!
  }

  type Query {
    getDataPoints: [DataPoint!]!
  }

  type Subscription {
    dataPointAdded: DataPoint!
  }

  type Mutation {
    addDataPoint(value: Float!, label: String!, category: String!): DataPoint!
  }
`;

// Define resolvers
const resolvers = {
  Query: {
    getDataPoints: () => dataPoints,
  },
  
  Mutation: {
    addDataPoint: (_, { value, label, category }) => {
      const newDataPoint = {
        id: String(nextId++),
        value,
        label,
        timestamp: new Date().toISOString(),
        category
      };
      
      dataPoints.push(newDataPoint);
      
      // Publish event
      pubsub.publish(DATA_POINT_ADDED, { dataPointAdded: newDataPoint });
      
      return newDataPoint;
    },
  },
  
  Subscription: {
    dataPointAdded: {
      subscribe: () => pubsub.asyncIterator([DATA_POINT_ADDED])
    }
  }
};

// Function to generate random data points
const generateRandomDataPoint = () => {
  const categories = ['Category A', 'Category B', 'Category C', 'Category D'];
  const randomValue = Math.round(Math.random() * 100);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const label = `Point ${nextId}`;
  
  // Use the mutation resolver to add the data point
  resolvers.Mutation.addDataPoint(
    null,
    { 
      value: randomValue, 
      label, 
      category: randomCategory 
    }
  );
};

// Create schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

async function startServer() {
  // Create Express app and HTTP server
  const app = express();
  const httpServer = createServer(app);

  // Create a WebSocket server for handling subscription connections
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Simple WebSocket implementation
  wsServer.on('connection', (socket) => {
    console.log('WebSocket client connected');
    let subscriptionId = null;
    
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Received message:', data.type);
        
        // Handle subscription init
        if (data.type === 'connection_init') {
          socket.send(JSON.stringify({ type: 'connection_ack' }));
        }
        
        // Handle subscription requests
        if (data.type === 'subscribe' && data.payload && data.payload.query) {
          // Check if it's the dataPointAdded subscription
          if (data.payload.query.includes('dataPointAdded')) {
            subscriptionId = data.id;
            console.log(`Client subscribed to dataPointAdded with id: ${subscriptionId}`);
            
            // Set up PubSub listener
            const listener = (dataPoint) => {
              // Send the data to the client
              socket.send(JSON.stringify({
                type: 'next',
                id: subscriptionId,
                payload: { data: dataPoint }
              }));
            };
            
            // Add listener for data point events
            pubsub.subscribe(DATA_POINT_ADDED, listener);
            
            // Clean up when socket closes
            socket.on('close', () => {
              pubsub.unsubscribe(DATA_POINT_ADDED, listener);
            });
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    socket.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Create Apollo Server
  const server = new ApolloServer({
    schema
  });

  // Start Apollo Server
  await server.start();

  // Apply Express middleware
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server)
  );
  
  // REST API endpoint to fetch all data points
  app.get('/api/data', cors(), (req, res) => {
    console.log('REST API called: GET /api/data', req.query);
    // Handle optional query parameters
    const { limit, category, after } = req.query;
    
    // Create a copy of the data for filtering
    let filteredData = [...dataPoints];
    
    // Filter by category if specified
    if (category) {
      filteredData = filteredData.filter(point => point.category === category);
    }
    
    // Filter by timestamp if 'after' is specified
    if (after) {
      const afterTimestamp = new Date(after).getTime();
      if (!isNaN(afterTimestamp)) {
        filteredData = filteredData.filter(point => 
          new Date(point.timestamp).getTime() > afterTimestamp
        );
      }
    }
    
    // Sort by timestamp (newest first)
    filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit if specified
    if (limit && !isNaN(parseInt(limit))) {
      filteredData = filteredData.slice(0, parseInt(limit));
    }
    
    // Return the data as JSON
    res.json({
      success: true,
      count: filteredData.length,
      data: filteredData
    });
  });
  
  // REST API endpoint to get data by ID
  app.get('/api/data/:id', cors(), (req, res) => {
    console.log('REST API called: GET /api/data/:id', req.params);
    const { id } = req.params;
    const dataPoint = dataPoints.find(point => point.id === id);
    
    if (!dataPoint) {
      return res.status(404).json({
        success: false,
        message: `Data point with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: dataPoint
    });
  });
  
  // Serve static files
  app.use(express.static(path.join(__dirname, 'build')));
  
  // Serve React app for root path
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });

  // Start the server
  const PORT = process.env.PORT || 5000;
  await new Promise(resolve => httpServer.listen({ port: PORT }, resolve));
  
  console.log(`Server ready at http://0.0.0.0:${PORT}`);
  console.log(`GraphQL endpoint: http://0.0.0.0:${PORT}/graphql`);
  console.log(`WebSocket endpoint for subscriptions: ws://0.0.0.0:${PORT}/graphql`);
  console.log(`REST API endpoints: 
  - GET http://0.0.0.0:${PORT}/api/data
  - GET http://0.0.0.0:${PORT}/api/data/:id`);
  
  // Generate random data every 3 seconds
  setInterval(generateRandomDataPoint, 3000);
  
  return { server, app, httpServer };
}

// Start the server
startServer().catch(err => {
  console.error('Error starting server:', err);
});
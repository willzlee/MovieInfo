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
  
  // Generate random data every 3 seconds
  setInterval(generateRandomDataPoint, 3000);
  
  return { server, app, httpServer };
}

// Start the server
startServer().catch(err => {
  console.error('Error starting server:', err);
});
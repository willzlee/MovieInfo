const express = require('express');
const http = require('http');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const typeDefs = require('./schema/schema');
const { resolvers, generateRandomDataPoint } = require('./schema/resolvers');
const path = require('path');

// Create Express app and HTTP server
const app = express();
const httpServer = http.createServer(app);

// Create schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create Apollo Server
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server
    ApolloServerPluginDrainHttpServer({ httpServer })
  ],
});

// Initialize Apollo Server
const startServer = async () => {
  await server.start();
  
  // Apply Express middleware
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server)
  );
  
  // Serve static assets
  app.use(express.static(path.join(__dirname, '../build')));
  
  // Handle all other requests with the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
  
  // Start the server
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ready at http://0.0.0.0:${PORT}`);
    console.log(`GraphQL endpoint: http://0.0.0.0:${PORT}/graphql`);
    console.log(`WebSocket endpoint for subscriptions: ws://0.0.0.0:${PORT}/graphql`);
    
    // Generate random data every 3 seconds for demonstration
    setInterval(generateRandomDataPoint, 3000);
  });
};

// Start the server
startServer().catch(err => {
  console.error('Error starting server:', err);
});
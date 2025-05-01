const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const cors = require('cors');
const typeDefs = require('./server/schema/schema');
const { resolvers, generateRandomDataPoint } = require('./server/schema/resolvers');

async function startServer() {
  // Create Express app and HTTP server
  const app = express();
  const httpServer = createServer(app);

  // Create schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Set up WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Use the WebSocket server with our schema
  const serverCleanup = useServer({ schema }, wsServer);

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for the HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for the WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  // Initialize Apollo Server
  await server.start();

  // Apply Express middleware
  app.use('/graphql', cors(), express.json(), expressMiddleware(server));

  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, 'build')));

  // Serve the React app for any request that doesn't match the above
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });

  // Start the server
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ready at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`WebSocket endpoint for subscriptions: ws://localhost:${PORT}/graphql`);

    // Generate random data every 3 seconds for demonstration
    setInterval(generateRandomDataPoint, 3000);
  });
}

// Start the server
startServer().catch(err => {
  console.error('Error starting server:', err);
});
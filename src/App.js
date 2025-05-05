import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import Dashboard from './components/Dashboard';

// Get the host from the current window location
const getHost = () => {
  // Use window.location.host in browser, or fallback to 0.0.0.0:5000 in development
  return typeof window !== 'undefined' ? window.location.host : '0.0.0.0:5000';
};

// Create an HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: `http://${getHost()}/graphql`
});

// Create a WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(createClient({
  url: `ws://${getHost()}/graphql`,
  options: {
    reconnect: true,
  }
}));

// Using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const splitLink = split(
  // Split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

// Create Apollo Client instance
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="container">
        <header>
          <h1>Real-Time Data Visualization</h1>
        </header>
        <Dashboard />
      </div>
    </ApolloProvider>
  );
}

export default App;
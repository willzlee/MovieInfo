const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

// Constants for subscription events
const DATA_POINT_ADDED = 'DATA_POINT_ADDED';

// In-memory data store
let dataPoints = [];
let nextId = 1;

// GraphQL resolvers
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
      
      // Publish the event for subscriptions
      pubsub.publish(DATA_POINT_ADDED, { dataPointAdded: newDataPoint });
      
      return newDataPoint;
    },
  },
  
  Subscription: {
    dataPointAdded: {
      subscribe: () => pubsub.asyncIterator([DATA_POINT_ADDED]),
    },
  },
};

// Function to add random data points (for demonstration purposes)
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

module.exports = { resolvers, generateRandomDataPoint };
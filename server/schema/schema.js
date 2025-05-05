// GraphQL schema definition
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

module.exports = typeDefs;
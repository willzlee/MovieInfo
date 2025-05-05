import { gql } from '@apollo/client';

// Query to get all data points
export const GET_DATA_POINTS = gql`
  query GetDataPoints {
    getDataPoints {
      id
      value
      label
      timestamp
      category
    }
  }
`;

// Subscription to listen for new data points
export const DATA_POINT_ADDED_SUBSCRIPTION = gql`
  subscription OnDataPointAdded {
    dataPointAdded {
      id
      value
      label
      timestamp
      category
    }
  }
`;

// Mutation to add a new data point (for manual testing)
export const ADD_DATA_POINT = gql`
  mutation AddDataPoint($value: Float!, $label: String!, $category: String!) {
    addDataPoint(value: $value, label: $label, category: $category) {
      id
      value
      label
      timestamp
      category
    }
  }
`;
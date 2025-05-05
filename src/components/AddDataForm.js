import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADD_DATA_POINT, GET_DATA_POINTS } from '../graphql/queries';

const AddDataForm = () => {
  const [formState, setFormState] = useState({
    value: '',
    label: '',
    category: ''
  });
  
  const [addDataPoint, { loading, error }] = useMutation(ADD_DATA_POINT, {
    onCompleted: () => {
      // Reset form after successful submission
      setFormState({
        value: '',
        label: '',
        category: ''
      });
    },
    // Update cache after mutation
    refetchQueries: [{ query: GET_DATA_POINTS }]
  });
  
  const handleSubmit = e => {
    e.preventDefault();
    
    // Validate form
    if (!formState.value || !formState.label || !formState.category) {
      alert('Please fill in all fields');
      return;
    }
    
    // Submit form
    addDataPoint({
      variables: {
        value: parseFloat(formState.value),
        label: formState.label,
        category: formState.category
      }
    });
  };
  
  return (
    <div className="chart-container">
      <h2>Add Data Point</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={formGroupStyle}>
          <label htmlFor="value">Value:</label>
          <input
            id="value"
            type="number"
            step="0.01"
            value={formState.value}
            onChange={e => setFormState({
              ...formState,
              value: e.target.value
            })}
            style={inputStyle}
            required
          />
        </div>
        
        <div style={formGroupStyle}>
          <label htmlFor="label">Label:</label>
          <input
            id="label"
            type="text"
            value={formState.label}
            onChange={e => setFormState({
              ...formState,
              label: e.target.value
            })}
            style={inputStyle}
            required
          />
        </div>
        
        <div style={formGroupStyle}>
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={formState.category}
            onChange={e => setFormState({
              ...formState,
              category: e.target.value
            })}
            style={inputStyle}
            required
          >
            <option value="">Select a category</option>
            <option value="Category A">Category A</option>
            <option value="Category B">Category B</option>
            <option value="Category C">Category C</option>
            <option value="Category D">Category D</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? 'Adding...' : 'Add Data Point'}
        </button>
        
        {error && (
          <div style={errorStyle}>
            Error: {error.message}
          </div>
        )}
      </form>
    </div>
  );
};

// Styles
const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const inputStyle = {
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '16px'
};

const buttonStyle = {
  padding: '10px',
  backgroundColor: '#4a90e2',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px'
};

const errorStyle = {
  color: 'red',
  marginTop: '10px'
};

export default AddDataForm;
import React, { useState } from 'react';

export const Comments = ({ movieId, comments, onAddComment, onDeleteComment }) => {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !comment.trim()) {
      setError('Please enter both your name and comment');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${movieId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, comment })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Clear form
        setName('');
        setComment('');
        // Add new comment to the list
        onAddComment(data.comment);
      } else {
        setError(data.message || 'Error posting comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post your comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${movieId}/${commentId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        onDeleteComment(commentId);
      } else {
        alert(data.message || 'Error deleting comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete the comment. Please try again.');
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <section className="comments-section">
      <h2>Comments</h2>
      
      <div className="comment-form">
        <h3>Add a Comment</h3>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="comment">Your Comment</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              disabled={isSubmitting}
              required
            ></textarea>
          </div>
          
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>
      
      <div className="comments-list" id="commentsList">
        {comments && comments.length > 0 ? (
          comments.map(comment => (
            <div className="comment" key={comment.id} data-comment-id={comment.id}>
              <div className="comment-header">
                <h4>{comment.name}</h4>
                <span className="comment-date">{formatDate(comment.timestamp)}</span>
                <button 
                  className="delete-comment" 
                  onClick={() => handleDelete(comment.id)}
                >
                  Delete
                </button>
              </div>
              <p className="comment-text">{comment.comment}</p>
            </div>
          ))
        ) : (
          <div className="no-comments-message">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </section>
  );
};
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const commentForm = document.getElementById('commentForm');
    const commentsList = document.getElementById('commentsList');
    
    // Get movie ID from the URL
    const movieId = window.location.pathname.split('/').pop();
    
    // Add event listener for comment form submission
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('name');
            const commentInput = document.getElementById('comment');
            
            // Validate inputs
            if (!nameInput.value.trim() || !commentInput.value.trim()) {
                return alert('Please enter both your name and comment');
            }
            
            // Create comment data
            const commentData = {
                name: nameInput.value.trim(),
                comment: commentInput.value.trim()
            };
            
            // Send to server
            fetch(`/api/comments/${movieId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Clear form
                    nameInput.value = '';
                    commentInput.value = '';
                    
                    // Add new comment to the list
                    addCommentToDOM(data.comment);
                    
                    // Remove no comments message if it exists
                    const noCommentsMsg = document.querySelector('.no-comments-message');
                    if (noCommentsMsg) {
                        noCommentsMsg.remove();
                    }
                } else {
                    alert('Error posting comment: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error posting comment:', error);
                alert('Failed to post your comment. Please try again.');
            });
        });
    }
    
    // Add event delegation for delete buttons
    if (commentsList) {
        commentsList.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-comment')) {
                const commentId = e.target.getAttribute('data-comment-id');
                const comment = e.target.closest('.comment');
                
                if (confirm('Are you sure you want to delete this comment?')) {
                    deleteComment(movieId, commentId, comment);
                }
            }
        });
    }
    
    // Function to add a new comment to the DOM
    function addCommentToDOM(comment) {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.setAttribute('data-comment-id', comment.id);
        
        commentElement.innerHTML = `
            <div class="comment-header">
                <h4>${escapeHTML(comment.name)}</h4>
                <span class="comment-date">${new Date(comment.timestamp).toLocaleString()}</span>
                <button class="delete-comment" data-comment-id="${comment.id}">Delete</button>
            </div>
            <p class="comment-text">${escapeHTML(comment.comment)}</p>
        `;
        
        // Add to the beginning of the list
        commentsList.prepend(commentElement);
    }
    
    // Function to delete a comment
    function deleteComment(movieId, commentId, commentElement) {
        fetch(`/api/comments/${movieId}/${commentId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove from DOM
                commentElement.remove();
                
                // Check if there are no more comments
                if (commentsList.children.length === 0) {
                    commentsList.innerHTML = `
                        <div class="no-comments-message">
                            <p>No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    `;
                }
            } else {
                alert('Error deleting comment: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error deleting comment:', error);
            alert('Failed to delete the comment. Please try again.');
        });
    }
    
    // Helper function to escape HTML
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
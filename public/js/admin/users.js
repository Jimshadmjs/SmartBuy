const updateUserStatus = async (userId, isBlocked) => {
    const url = `/admin/users/${userId}`;
    const data = { isBlocked: !isBlocked };

    try {
        const response = await axios.patch(url, data);
        console.log('User status updated:', response.data);
        location.reload();
    } catch (error) {
        console.error('Error updating user status:', error);
    }
};

document.querySelectorAll('.block-btn, .unblock-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        const userId = event.target.getAttribute('data-user-id'); // Get user ID
        const isBlocked = event.target.classList.contains('unblock-btn'); // Check if it's an unblock button

        // Confirm action based on the button clicked
        const action = isBlocked ? 'unblock' : 'block';
        const confirmation = confirm(`Are you sure you want to ${action} this user?`);

        if (confirmation) {
            updateUserStatus(userId, isBlocked); // Call the function to update status
        }
    });
});

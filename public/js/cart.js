document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-id'); // Get the item ID
        const userId = window.userId; // Get user ID from session or context

        // Show SweetAlert confirmation dialog
        Swal.fire({
            title: 'Are you sure?',
            text: "Do you really want to remove this item from the cart?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // If user confirms, send the request to remove the item
                axios.patch(`/cart/remove/${userId}`, { itemId })
                    .then(response => {
                        if (response.data.success) {
                            location.reload(); // Reload the page to reflect changes
                        } else {
                            console.error('Failed to remove item from cart');
                        }
                    })
                    .catch(error => {
                        console.error('Error removing item from cart:', error);
                    });
            }
        });
    });
});
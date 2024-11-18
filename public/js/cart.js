// to remove item from cart

document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-id'); 
        const userId = window.userId; 

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
                
                axios.patch(`/cart/remove/${userId}`, { itemId })
                    .then(response => {
                        if (response.data.success) {
                            location.reload(); 
                        } else {
                        }
                    })
                    .catch(error => {
                    });
            }
        });
    });
});



// update cart count 

document.addEventListener('DOMContentLoaded', () => {
    const cartItems = document.querySelectorAll('.table_row');

    cartItems.forEach(item => {
		
        const quantityInput = item.querySelector('.num-product');
        const increaseButton = item.querySelector('.btn-num-product-up');
        const decreaseButton = item.querySelector('.btn-num-product-down');
        const itemId = item.querySelector('.remove-item').getAttribute('data-id'); 
        const productId = item.querySelector('.remove-item').getAttribute('data-productId'); 
		
        // Handle increase quantity
        increaseButton.addEventListener('click', async () => {
			
            let currentQuantity = parseInt(quantityInput.value);
            const availableStock = await checkStock(productId);

            // Check conditions before updating quantity
            if (currentQuantity <= 5 && currentQuantity <= availableStock) {
				
                quantityInput.value = currentQuantity;
                updateCartTotal();
                updateCartItemQuantity(itemId, currentQuantity); 
            } else if (currentQuantity > 5) {
                Swal.fire('Maximum Limit Reached', 'You cannot add more than 5 items!', 'warning');
            } else if (currentQuantity > availableStock) {
                Swal.fire('Stock Limit Reached', 'You cannot exceed available stock!', 'warning')
            .then(() => {
               location.reload()
            });
            }
        });

        // Handle decrease quantity
        decreaseButton.addEventListener('click', () => {

            let currentQuantity = parseInt(quantityInput.value);

            // Ensure quantity doesn't go below 1
            if (currentQuantity >= 1) {
				
                quantityInput.value = currentQuantity;
                updateCartTotal();
                updateCartItemQuantity(itemId, currentQuantity); 
            }
        });

        // Update total price when quantity changes
        quantityInput.addEventListener('input', () => {
            let currentQuantity = parseInt(quantityInput.value);
            if (isNaN(currentQuantity) || currentQuantity < 1) {
                quantityInput.value = 1; 
                currentQuantity = 1;
            } else if (currentQuantity > 5) {
                Swal.fire('Maximum Limit Reached', 'You cannot add more than 5 items!', 'warning');
                quantityInput.value = 5; 
                currentQuantity = 5;
            }
			

            updateCartTotal();
            updateCartItemQuantity(itemId, currentQuantity); 
        });
    });

    // Function to update the total price
    function updateCartTotal() {
        let cartTotal = 0;

        cartItems.forEach(item => {
            const quantity = parseInt(item.querySelector('.num-product').value);
            const price = parseFloat(item.querySelector('.column-3').textContent.replace('₹', ''));
            const itemTotal = price * quantity;3
            cartTotal += itemTotal;
            item.querySelector('.column-5').textContent = '₹' + itemTotal
        });

        // Update the cart total display
        document.querySelector('.mtext-110.cl2').textContent = '₹' + cartTotal
    }

    // Function to check stock availability
    async function checkStock(productId) {
        try {
            const response = await axios.post(`/cart/check-stock/${productId}`);
            return response.data.availableStock; 
        } catch (error) {
            return 0; 
        }
    }

    // Function to update cart item quantity in the backend
    function updateCartItemQuantity(itemId, quantity) {

        axios.patch(`/cart/update/${userId}`, { itemId,quantity })
            .then(response => {
                if (!response.data.success) {
                    console.error('Failed to update item quantity in cart');
                }
            })
            .catch(error => {
                console.error('Error updating item quantity in cart:', error);
            });
    }
});


// prevent cart count 
document.addEventListener("DOMContentLoaded", function() {
    const quantityInputs = document.querySelectorAll('.num-product');

    quantityInputs.forEach(input => {
        const btnUp = input.parentElement.querySelector('.btn-num-product-up');
        const btnDown = input.parentElement.querySelector('.btn-num-product-down');

        // Function to update button states
        function updateButtonStates() {
            const value = parseInt(input.value);
            btnUp.disabled = value >= 5; 
            btnDown.disabled = value <= 1; 
        }

        // Initial check
        updateButtonStates();

        // Event listeners for input changes
        input.addEventListener('input', updateButtonStates);

        // Event listeners for button clicks
        btnUp.addEventListener('click', function() {
            input.value = Math.min(5, parseInt(input.value) );
            updateButtonStates();
        });

        btnDown.addEventListener('click', function() {
            input.value = Math.max(1, parseInt(input.value) );
            updateButtonStates();
        });
    });
});
 // Add event listener to remove item buttons
 document.querySelectorAll('.remove-wishlist-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
        const productID = e.target.closest('.wishlist-item').dataset.productId;

        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'Do you want to remove this item from your wishlist?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, remove it!',
            });

            if (result.isConfirmed) {
                const response = await axios.delete('/wishlist/remove', {
                    data: { userID: userId, productID } // Send userID and productID
                });

                if (response.status === 200) {
                    Swal.fire(
                        'Removed!',
                        'The item has been removed from your wishlist.',
                        'success'
                    );
                    // Remove the item from the DOM
                    e.target.closest('.wishlist-item').remove();
                } else {
                    Swal.fire('Oops!', response.data.message, 'error');
                }
            }
        } catch (error) {
            Swal.fire('Error!', 'An error occurred while removing the item.', 'error');
        }
    });
});




document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
        const productId = this.getAttribute('data-id');

        // Check product stock before adding to cart
        checkStock(productId)
            .then(response => {
                if (response.inStock) {
                    const product = {
                        id: productId,
                        name: this.getAttribute('data-name'),
                        price: parseFloat(this.getAttribute('data-price')),
                        productImage: this.getAttribute('data-image')
                    };

                    // Check if adding would exceed stock
                    if (response.userQuantity < response.availableStock) {
                        addToCart(product)
                            .then(() => {
                                // Check for limited stock after adding
                                if (response.userQuantity + 1 > 5) {
                                    showLimitedStockAlert(`You already have 5 in your cart.`);
                                }
                            });
                    } else {
                        showOutOfStockAlert();
                    }
                } else {
                    showOutOfStockAlert();
                }
            })
            .catch(error => {
            });
    });
});

// Check product stock function
function checkStock(productId) {
    return axios.post(`/cart/check-stock/${productId}`)
        .then(response => response.data)
        .catch(error => {
            return { inStock: false, userQuantity: 0, availableStock: 0 };
        });
}

// Add to cart function

const number = document.getElementById('btn.value')

function addToCart(product) {
    const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.productImage
    };

    return axios.post(`/cart/add/${window.userId}`, cartItem)
        .then(response => {
            showSuccessAlert('Product added to cart successfully!');
            const cart = document.querySelector('.cart_notify')
            let cartCount = cart.setAttribute('data-notify',response.data.cartTotal)
        })
        .catch(error => {
            showLimitedStockAlert('You already have limited product in your cart.');
        });
}

// Show out of stock alert
function showOutOfStockAlert() {
    Swal.fire({
        icon: 'warning',
        title: 'Out of Stock',
        text: 'This product is currently unavailable.',
        confirmButtonText: 'OK'
    });
}

// Function to show the limited stock alert
function showLimitedStockAlert(message) {
    Swal.fire({
        icon: 'info',
        title: 'Limited Stock',
        text: message,
        confirmButtonText: 'OK'
    });
}

// Function to show the success alert
function showSuccessAlert(message) {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        confirmButtonText: 'OK'
    });
}

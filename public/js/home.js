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
									console.log("yes");
									
                                    showLimitedStockModal(`You already have ${response.userQuantity + 1} in your cart.`);
                                }
                            });
                    } else {
                        showOutOfStockModal();
                    }
                } else {
                    showOutOfStockModal();
                }
            })
            .catch(error => {
                console.error('Error checking stock:', error);
            });
    });
});

// Check product stock function
function checkStock(productId) {
    return axios.post(`/cart/check-stock/${productId}`)
        .then(response => {
            return response.data; 
        })
        .catch(error => {
            console.error('Error checking stock:', error);
            return { inStock: false, userQuantity: 0, availableStock: 0 };
        });
}

// Add to cart function
function addToCart(product) {
    const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.productImage
    };
  
    axios.post(`/cart/add/${window.userId}`, cartItem)
        .then(response => {
            showSuccessModal('Product added to cart successfully!');
            const cart = document.querySelector('.cart_notify')
            let cartCount = cart.setAttribute('data-notify',response.data.cartTotal)
            
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
			showLimitedStockModal(`You already have limited product in your cart.`);

        });
}

// Show out of stock modal
function showOutOfStockModal() {
    const modal = document.getElementById('outOfStockModal');
    modal.style.display = 'block';

    document.getElementById('okBtn').addEventListener('click', function() {
        modal.style.display = 'none';
    });
}




// Function to show the limited stock modal
function showLimitedStockModal(message) {
    const modal = document.getElementById('limitedStockModal');
    const messageElement = document.getElementById('limitedStockMessage');
    messageElement.textContent = message;
    modal.style.display = 'block';

    // Close the modal when the user clicks the close button
    document.getElementById('closeLimitedStockModal').onclick = function() {
        modal.style.display = 'none';
    };

    // OK button functionality to close the modal
    document.getElementById('okLimitedStockBtn').onclick = function() {
        modal.style.display = 'none';
    };
}


// Function to show the success modal
function showSuccessModal(message) {
    const modal = document.getElementById('successModal');
    const messageElement = document.getElementById('successMessage');
    messageElement.textContent = message;
    modal.style.display = 'block';

    // Close the modal when the user clicks the close button
    document.getElementById('closeSuccessModal').onclick = function() {
        modal.style.display = 'none';
    };

    // OK button functionality to close the modal
    document.getElementById('okSuccessBtn').onclick = function() {
        modal.style.display = 'none';
    };
}
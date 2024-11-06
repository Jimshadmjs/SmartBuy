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





// for seach products

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('input[name="search-product"]');
    const productCards = document.querySelectorAll('.col-sm-6.col-md-4.col-lg-3'); 

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();

        productCards.forEach(card => {
            const productName = card.querySelector('.card-title strong').innerText.toLowerCase();
            const productCategory = card.querySelector('.card-title').innerText.toLowerCase();

            if (productName.includes(query) || productCategory.includes(query)) {
                card.style.display = ''; 
            } else {
                card.style.display = 'none'; 
            }
        });
    });
});





// for sort and filters

document.addEventListener('DOMContentLoaded', () => {
    const productCards = Array.from(document.querySelectorAll('.col-sm-6.col-md-4.col-lg-3'));
    const sortLinks = document.querySelectorAll('.filter-link[data-sort]');

    sortLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const sortBy = event.target.getAttribute('data-sort');
            sortProducts(productCards, sortBy);
        });
    });

    function sortProducts(products, sortBy) {
        let sortedProducts;

        switch (sortBy) {
            case 'popularity':
                sortedProducts = products.sort((a, b) => {
                });
                break;
            case 'averageRating':
                    sortedProducts = products.sort((a, b) => {
                        const ratingA = parseFloat(a.getAttribute('data-rating')) || 0;
                        const ratingB = parseFloat(b.getAttribute('data-rating')) || 0;
                        return ratingB - ratingA; 
                    });
                    break;
            case 'newness':
                sortedProducts = products.sort((a, b) => {
                    
                    const dateA = new Date(a.getAttribute('data-created-at'));
                    const dateB = new Date(b.getAttribute('data-created-at'));
                    console.log(dateA,dateB);
                    
                    return dateB - dateA; 
                });
                break;
            case 'priceLowToHigh':
                sortedProducts = products.sort((a, b) => {
                    return parseFloat(a.querySelector('.card-text').innerText.replace('₹', '')) - 
                           parseFloat(b.querySelector('.card-text').innerText.replace('₹', ''));
                });
                break;
            case 'priceHighToLow':
                sortedProducts = products.sort((a, b) => {
                    return parseFloat(b.querySelector('.card-text').innerText.replace('₹', '')) - 
                           parseFloat(a.querySelector('.card-text').innerText.replace('₹', ''));
                });
                break;
            case 'aToZ':
                sortedProducts = products.sort((a, b) => {
                    const nameA = a.querySelector('.card-title strong').innerText.toLowerCase();
                    const nameB = b.querySelector('.card-title strong').innerText.toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                break;
            case 'zToA':
                sortedProducts = products.sort((a, b) => {
                    const nameA = a.querySelector('.card-title strong').innerText.toLowerCase();
                    const nameB = b.querySelector('.card-title strong').innerText.toLowerCase();
                    return nameB.localeCompare(nameA);
                });
                break;
                case 'default':
            default:
                location.reload()
                sortedProducts = products; 
                break;
        }

        const productContainer = document.getElementById('product-container');
        productContainer.innerHTML = '';

        sortedProducts.forEach(product => {
            console.log(product);
            
            productContainer.appendChild(product);
        });
    }
});
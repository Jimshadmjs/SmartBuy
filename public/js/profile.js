
        
        
        
        
        
        
        
        
        
        
        
        
        // order----------------------------------------------------------------------------------------------------
        
        
        document.addEventListener('DOMContentLoaded', function () {
    const cancelOrderButtons = document.querySelectorAll('.cancelOrder');

    cancelOrderButtons.forEach(button => {
        button.addEventListener('click', function () {
            const orderId = this.getAttribute('data-id');

            // SweetAlert confirmation
            Swal.fire({
                title: 'Are you sure?',
                text: "Do you really want to cancel this order?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, cancel it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Send cancel order request using Axios
                    axios.post(`/order/cancel/${orderId}`)
                        .then(response => {
                            Swal.fire(
                                'Cancelled!',
                                response.data.message,
                                'success'
                            ).then(() => {
                                location.reload(); // Reload to see updated orders
                            });
                        })
                        .catch(error => {
                            Swal.fire(
                                'Error!',
                                error.response.data.message || 'Something went wrong!',
                                'error'
                            );
                        });
                }
            });
        });
    });
});





// show details
document.addEventListener('DOMContentLoaded', function () {
    const viewOrderButtons = document.querySelectorAll('.viewOrder');

    viewOrderButtons.forEach(button => {
        button.addEventListener('click', function () {
            const orderId = this.getAttribute('data-id');

            // Fetch order details using Axios
            axios.get(`/order/details/${orderId}`)
                .then(response => {
                    const order = response.data;

                    // Populate the modal with order details
                    document.getElementById('orderedDate').innerText = new Date(order.orderedDate).toLocaleDateString();
                    document.getElementById('orderTime').innerText = new Date(order.orderedDate).toLocaleTimeString();
                    document.getElementById('orderStatus').innerText = order.orderStatus;
                    document.getElementById('shippingAddress').innerText = `${order.shippingAddress.fullname}, ${order.shippingAddress.address},  ${order.shippingAddress.pincode}`;
                    
                    const productsContainer = document.getElementById('orderedProducts');
                    productsContainer.innerHTML = ''; // Clear previous content
                    
                    order.items.forEach(item => {
                        productsContainer.innerHTML += `
                            <div class="col-md-4">
                                <div class="card mb-3">
                                    <img src="/${item.productID.images[0]}" class="card-img-top" alt="${item.productID.name}">
                                    <div class="card-body">
                                        <h5 class="card-title">${item.productID.name}</h5>
                                        <p class="card-text">Price: ₹${item.productID.price}</p>
                                        <p class="card-text">Quantity: ${item.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    });

                    document.getElementById('totalAmount').innerText = `₹${order.totalAmount}`;

                    // Show the modal
                    const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
                    modal.show();
                })
                .catch(error => {
                    console.error('Error fetching order details:', error);
                    alert('An error occurred while fetching order details.');
                });
        });
    });
});














document.addEventListener('DOMContentLoaded', function () {
    const addressModal = new bootstrap.Modal(document.getElementById('addressModal'));
    const addressForm = document.getElementById('addressForm');
    const openModalBtn = document.getElementById('openAddressModal');
    const closeModalBtns = document.querySelectorAll('#closeModal, #closeModalFooter');
    const submitAddressBtn = document.getElementById('submitAddress');




    // Handle delete address
    addressList.addEventListener('click', function(e) {
        if (e.target.classList.contains('deleteAddress')) {
            const addressId = e.target.dataset.id;
            const confirmation = confirm("Are you sure you want to delete this address?");
            if (confirmation) {
                axios.delete(`/daleteAddress/${addressId}`)
                    .then(response => {
                        console.log(response.data.message);
                        // Remove the address from the UI
                        e.target.closest('li').remove();
                    })
                    .catch(error => {
                        console.error('Error deleting address:', error);
                        // Optionally show an error message to the user
                    });
            }
        }
    });






    // Open modal for adding a new address
    openModalBtn.addEventListener('click', function () {
        addressForm.reset();
        clearValidationMessages();
        document.getElementById('addressId').value = ''; // Reset address ID for adding
        document.getElementById('addressModalLabel').innerText = 'Add New Address';
        submitAddressBtn.innerText = 'Add Address';
        addressModal.show(); // Use Bootstrap method to show the modal
    });

    // Close modal
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            addressModal.hide(); // Use Bootstrap method to hide the modal
        });
    });

    // Handle Add/Edit Address
    submitAddressBtn.addEventListener('click', function () {
        const addressId = document.getElementById('addressId').value;
        if (addressId) {            
            editAddress(addressId);
        } else {
            addAddress();
        }
    });

    // Open modal to edit an address
    document.getElementById('addressList').addEventListener('click', function(e) {
        if (e.target.classList.contains('editAddress')) {
            const button = e.target;
            document.getElementById('addressId').value = button.dataset.id;
            document.getElementById('fullName').value = button.dataset.fullname;
            document.getElementById('phone').value = button.dataset.phone;
            document.getElementById('address').value = button.dataset.address;
            document.getElementById('district').value = button.dataset.district;
            document.getElementById('city').value = button.dataset.city;
            document.getElementById('state').value = button.dataset.state;
            document.getElementById('pincode').value = button.dataset.pincode;
            document.getElementById('country').value = button.dataset.country;
            document.getElementById('addressType').value = button.dataset.type;
            

            document.getElementById('addressModalLabel').innerText = 'Edit Address';
            submitAddressBtn.innerText = 'Update Address';
            addressModal.show(); 
        }
    });


    // to add address
    function addAddress() {
        const addressData = getAddressData();
        if (validateForm(addressData)) {
            console.log(userId);
            
            axios.post(`/addAddress/${userId}`, addressData)
                .then(response => {
                    console.log('Address added:', response.data);
                    addressModal.hide(); 
                    addressForm.reset();
                    location.reload()
                })
                .catch(error => {
                    console.error('Error adding address:', error);
                });
        }
    }

    // edit address

   async function editAddress(addressId) {
        const addressData = getAddressData();
        if (validateForm(addressData)) {
            try {
            const response = await axios.patch(`/editAddress/${addressId}`, addressData);
            if (response.status === 200) {
                console.log("Address updated successfully");
                addressModal.hide();
                addressForm.reset();
                location.reload()
            } else {
                console.error("Failed to update address", response);
            }
        } catch (error) {
            console.error('Error updating address:', error);
        }
        }
    }

    function getAddressData() {
        return {
            fullName: document.getElementById('fullName').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            address: document.getElementById('address').value.trim(),
            district: document.getElementById('district').value.trim(),
            city: document.getElementById('city').value.trim(),
            state: document.getElementById('state').value.trim(),
            pincode: document.getElementById('pincode').value.trim(),
            country: document.getElementById('country').value.trim(),
            type: document.getElementById('addressType').value
        };
    }

    function validateForm(data) {
        let isValid = true;
        clearValidationMessages();

        if (!data.fullName) {
            displayError('fullNameError', 'Full Name cannot be empty or whitespace.');
            isValid = false;
        }
        if (!data.phone) {
            displayError('phoneError', 'Phone cannot be empty or whitespace.');
            isValid = false;
        }
        if (!data.address) {
            displayError('addressError', 'Address cannot be empty or whitespace.');
            isValid = false;
        }
        if (!data.district) {
            displayError('districtError', 'District cannot be empty or whitespace.');
            isValid = false;
        }
        if (!data.city) {
            displayError('cityError', 'City cannot be empty or whitespace.');
            isValid = false;
        }
        if (!data.state) {
            displayError('stateError', 'State cannot be empty or whitespace.');
            isValid = false;
        }
        if (!data.pincode) {
            displayError('pincodeError', 'Pincode cannot be empty or whitespace.');
            isValid = false;
        }
        if (!data.country) {
            displayError('countryError', 'Country cannot be empty or whitespace.');
            isValid = false;
        }

        return isValid;
    }

    function displayError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.innerText = message;
        setTimeout(() => {
            errorElement.innerText = '';
        }, 3000);
    }

    function clearValidationMessages() {
        const errorElements = [
            'fullNameError', 'phoneError', 'addressError',
            'districtError', 'cityError', 'stateError',
            'pincodeError', 'countryError'
        ];
        errorElements.forEach(id => {
            document.getElementById(id).innerText = '';
        });
    }
});




//update user details 


document.getElementById('profileForm').addEventListener('submit', function (e) {
    e.preventDefault(); 

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;

    const updatedDetails = {
        username: username,
        email: email
    };

    // Use Axios to send a PATCH request to update the profile
    axios.patch(`/userDetails/${userId}`, updatedDetails)
        .then(response => {
            alert('Profile updated successfully!');
        })
        .catch(error => {
            console.error(error);
            alert('There was an error updating the profile.');
        });
});

// order----------------------------------------------------------------------------------------------------





document.addEventListener('DOMContentLoaded', function () {
    const cancelOrderButtons = document.querySelectorAll('.cancelOrder');
    let orderIdToCancel = null;
    let modal;

    cancelOrderButtons.forEach(button => {
        button.addEventListener('click', function () {
            orderIdToCancel = this.getAttribute('data-id');
            modal = new bootstrap.Modal(document.getElementById('cancelOrderModal'));
            modal.show();
        });
    });

    document.getElementById('confirmCancelBtn').addEventListener('click', function () {
        const reason = document.getElementById('cancellationReason').value.trim();

        if (!reason) {
            document.getElementById('error-message').style.display = 'block';
            document.getElementById('error-message').innerText = 'Please enter a reason for cancellation.';
            return;
        }


        axios.post(`/order/cancel/${orderIdToCancel}`, { reason })
            .then(response => {
                modal.hide();
                Swal.fire('Cancelled!', response.data.message, 'success').then(() => {
                    location.reload();
                });
            })
            .catch(error => {
                modal.hide();
                Swal.fire('Error!', error.response.data.message || 'Something went wrong!', 'error');
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
                    const orderedDate = new Date(order.orderedDate);
                    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
                    document.getElementById('orderedDate').innerText = orderedDate.toLocaleDateString('en-IN', options);
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
                                        <p class="card-text">Price: ₹${item.price}</p>
                                        <p class="card-text">Quantity: ${item.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    });

                    document.getElementById('totalAmount').innerText = `₹${order.totalAmount}`;

                     // Show or hide the download invoice button
                     const downloadInvoiceButton = document.getElementById('downloadInvoice');
                     if (order.orderStatus === 'Delivered') {
                         downloadInvoiceButton.style.display = 'block';
                         downloadInvoiceButton.onclick = () => downloadInvoice(orderId);
                     } else {
                         downloadInvoiceButton.style.display = 'none';
                    }

                    // Show the modal
                    const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
                    modal.show();
                })
                .catch(error => {
                    alert('An error occurred while fetching order details.');
                });
        });
    });

        // Function to trigger invoice download
        function downloadInvoice(orderId) {
            axios.get(`/invoice/${orderId}`, { responseType: 'blob' })
                .then(response => {
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Invoice_${orderId}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                })
                .catch(error => {
                    alert('Failed to download the invoice.');
                });
        }
});









// address

document.addEventListener('DOMContentLoaded', function () {
    const addressModal = new bootstrap.Modal(document.getElementById('addressModal'));
    const addressForm = document.getElementById('addressForm');
    const openModalBtn = document.getElementById('openAddressModal');
    const closeModalBtns = document.querySelectorAll('#closeModal, #closeModalFooter');
    const submitAddressBtn = document.getElementById('submitAddress');




    // Handle delete address
    addressList.addEventListener('click', function (e) {
        if (e.target.classList.contains('deleteAddress')) {
            const addressId = e.target.dataset.id;
            const confirmation = confirm("Are you sure you want to delete this address?");
            if (confirmation) {
                axios.delete(`/daleteAddress/${addressId}`)
                    .then(response => {
                        // Remove the address from the UI
                        e.target.closest('li').remove();
                    })
                    .catch(error => {
                    });
            }
        }
    });






    // Open modal for adding a new address
    openModalBtn.addEventListener('click', function () {
        addressForm.reset();
        clearValidationMessages();
        document.getElementById('addressId').value = '';
        document.getElementById('addressModalLabel').innerText = 'Add New Address';
        submitAddressBtn.innerText = 'Add Address';
        addressModal.show();
    });

    // Close modal
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            addressModal.hide();
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
    document.getElementById('addressList').addEventListener('click', function (e) {
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

            axios.post(`/addAddress/${userId}`, addressData)
                .then(response => {
                    addressModal.hide();
                    addressForm.reset();
                    location.reload()
                })
                .catch(error => {
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
                    addressModal.hide();
                    addressForm.reset();
                    location.reload()
                } else {
                }
            } catch (error) {
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

        const nameRegex = /^[a-zA-Z\s]+$/;
        const phoneRegex = /^[1-9][0-9]{9}$/;
        const pincodeRegex = /^[1-9][0-9]{5}$/;

        if (!data.fullName || !nameRegex.test(data.fullName)) {
            displayError('fullNameError', 'Full Name must contain only letters and spaces.');
            isValid = false;
        }

        if (!data.phone || !phoneRegex.test(data.phone)) {
            displayError('phoneError', 'Phone number must be 10 digits and cannot start with 0.');
            isValid = false;
        }

        if (!data.address.trim()) {
            displayError('addressError', 'Address cannot be empty or whitespace.');
            isValid = false;
        }

        if (!data.district.trim()) {
            displayError('districtError', 'District cannot be empty or whitespace.');
            isValid = false;
        }

        if (!data.city.trim()) {
            displayError('cityError', 'City cannot be empty or whitespace.');
            isValid = false;
        }

        if (!data.state.trim()) {
            displayError('stateError', 'State cannot be empty or whitespace.');
            isValid = false;
        }

        if (!data.pincode || !pincodeRegex.test(data.pincode)) {
            displayError('pincodeError', 'Pincode must be 6 digits and cannot start with 0.');
            isValid = false;
        }

        if (!data.country.trim()) {
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
            alert('There was an error updating the profile.');
        });
});








// to reset password


document.getElementById('resetPasswordBtn').addEventListener('click', function () {
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    modal.show();
    resetValidationMessages();
});

document.getElementById('submitResetPassword').addEventListener('click', function () {
    validateAndSubmit();
});

document.getElementById('currentEmail').addEventListener('input', validateEmail);
document.getElementById('currentPassword').addEventListener('input', validateCurrentPassword);
document.getElementById('newPassword').addEventListener('input', validateNewPassword);

document.getElementById('toggleCurrentPassword').addEventListener('click', function () {
    togglePasswordVisibility('currentPassword', 'currentPasswordIcon');
});

document.getElementById('toggleNewPassword').addEventListener('click', function () {
    togglePasswordVisibility('newPassword', 'newPasswordIcon');
});

function validateAndSubmit() {
    resetValidationMessages();

    const currentEmail = document.getElementById('currentEmail').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    let valid = true;

    if (!currentEmail) {
        showError('currentEmail', 'This field is required');
        valid = false;
    }

    if (!currentPassword) {
        showError('currentPassword', 'This field is required');
        valid = false;
    }

    if (!newPassword) {
        showError('newPassword', 'This field is required');
        valid = false;
    } else {
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordPattern.test(newPassword)) {
            showError('newPassword', 'Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.');
            valid = false;
        }
    }

    if (!valid) {
        return;
    }

    const data = {
        email: currentEmail,
        currentPassword: currentPassword,
        newPassword: newPassword
    };

    axios.patch(`/resetPassword/${userId}`, data)
        .then(response => {
            Swal.fire({
                title: 'Success!',
                text: 'Password updated successfully!',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                location.reload();
            });
        })
        .catch(error => {
            if (error.response) {

                Swal.fire({
                    title: 'Error!',
                    text: error.response.data.message || 'Failed to update password. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            } else {

                Swal.fire({
                    title: 'Error!',
                    text: 'An error occurred. Please try again later.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
}


function validateEmail() {
    const emailField = document.getElementById('currentEmail');
    if (!emailField.value) {
        showError('currentEmail', 'This field is required');
    } else {
        clearError('currentEmail');
    }
}

function validateCurrentPassword() {
    const passwordField = document.getElementById('currentPassword');
    if (!passwordField.value) {
        showError('currentPassword', 'This field is required');
    } else {
        clearError('currentPassword');
    }
}

function validateNewPassword() {
    const passwordField = document.getElementById('newPassword');
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordField.value) {
        showError('newPassword', 'This field is required');
    } else if (!passwordPattern.test(passwordField.value)) {
        showError('newPassword', 'Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.');
    } else {
        clearError('newPassword');
    }
}

function togglePasswordVisibility(fieldId, iconId) {
    const passwordField = document.getElementById(fieldId);
    const icon = document.getElementById(iconId);
    const isPasswordVisible = passwordField.type === 'text';

    passwordField.type = isPasswordVisible ? 'password' : 'text';
    icon.classList.toggle('bi-eye', !isPasswordVisible);
    icon.classList.toggle('bi-eye-slash', isPasswordVisible);
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.form-text.text-danger');

    if (!existingError) {
        const errorMessage = document.createElement('small');
        errorMessage.className = 'form-text text-danger';
        errorMessage.innerText = message;
        field.parentNode.appendChild(errorMessage);
    }
}

function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.form-text.text-danger');

    if (existingError) {
        existingError.remove();
    }
}

function resetValidationMessages() {
    const errorMessages = document.querySelectorAll('.form-text.text-danger');
    errorMessages.forEach(msg => msg.remove());
}


// show tansaction modal
document.addEventListener('DOMContentLoaded', () => {
    const viewTransactionsButton = document.getElementById('viewTransactionsButton');
    const transactionsModal = document.getElementById('transactionsModal');

    viewTransactionsButton.addEventListener('click', async () => {
        try {
            const response = await axios.get('/wallet/transactions');
            const transactions = response.data;

            const transactionsContainer = document.getElementById('transactionsContainer');
            transactionsContainer.innerHTML = '';

            transactions.forEach(transaction => {
                const transactionItem = document.createElement('div');
                transactionItem.className = 'list-group-item';
                transactionItem.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <strong>${transaction.type}</strong>
                        <small>${new Date(transaction.date).toLocaleDateString('en-IN')}</small>
                    </div>
                    <p class="mb-1">Amount: <span class="text-success">${transaction.amount}</span></p>
                    <small>${transaction.description}</small>
                `;
                transactionsContainer.appendChild(transactionItem);
            });

            // Show the modal after loading transactions
            const modal = new bootstrap.Modal(transactionsModal);
            modal.show();
        } catch (error) {
        }
    });
});
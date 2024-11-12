// Open the coupon modal
function openCouponModal() {
    document.getElementById('couponModal').style.display = 'block';
    clearModalFields();
}

// Close the coupon modal
function closeModal() {
    document.getElementById('couponModal').style.display = 'none';
}

// Clear modal fields
function clearModalFields() {
    document.getElementById('couponForm').reset();
    clearErrorMessages();
}

// Handle form submission
document.getElementById('couponForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    clearErrorMessages();

    const couponData = {
        couponCode: document.getElementById('couponCode').value,
        discountType: document.getElementById('discountType').value,
        discountAmount: parseFloat(document.getElementById('discountAmount').value),
        minAmount: parseFloat(document.getElementById('minAmount').value),
        maxAmount: parseFloat(document.getElementById('maxAmount').value),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
    };

    // Validation
    const validationErrors = validateCouponData(couponData);
    if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
            document.getElementById(error.field).innerText = error.message;
        });
        return;
    }

    try {
        const response = await axios.post('/admin/coupons/add', couponData);
        await Swal.fire({
            title: 'Success!',
            text: response.data.message,
            icon: 'success',
            confirmButtonText: 'OK'
        });
        location.reload()
        closeModal();
    } catch (error) {
        await Swal.fire({
            title: 'Error!',
            text: error.response.data.message || 'Error adding coupon',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});

function validateCouponData(data) {
    const errors = [];
    const today = new Date().toISOString().split('T')[0];

    if (data.discountAmount < 0) {
        errors.push({ field: 'discountAmountError', message: 'Discount amount cannot be negative.' });
    }

    if (data.minAmount < 0) {
        errors.push({ field: 'minAmountError', message: 'Minimum amount cannot be negative.' });
    }

    if (data.maxAmount < 0) {
        errors.push({ field: 'maxAmountError', message: 'Maximum amount cannot be negative.' });
    }

    if (data.startDate < today) {
        errors.push({ field: 'startDateError', message: 'Start date cannot be in the past.' });
    }

    if (data.endDate < data.startDate) {
        errors.push({ field: 'endDateError', message: 'End date cannot be before start date.' });
    }
    if (data.minAmount < data.discountAmount) {
        errors.push({ field: 'minAmountError', message: 'Minimum amount cannot be less than the discount amount.' });
    }
    if (data.maxAmount < data.minAmount) {
        errors.push({ field: 'maxAmountError', message: 'Maximum amount cannot be less than the minimum amount.' });
    }

    return errors;
}

function clearErrorMessages() {
    document.getElementById('couponCodeError').innerText = '';
    document.getElementById('discountTypeError').innerText = '';
    document.getElementById('discountAmountError').innerText = '';
    document.getElementById('minAmountError').innerText = '';
    document.getElementById('maxAmountError').innerText = '';
    document.getElementById('startDateError').innerText = '';
    document.getElementById('endDateError').innerText = '';
}





// edit coupon
function validateEditCouponData(data) {
    const errors = [];
    const today = new Date().toISOString().split('T')[0];

    if (data.discountAmount < 0) {
        errors.push({ field: 'editDiscountAmountError', message: 'Discount amount cannot be negative.' });
    }

    if (data.minAmount < 0) {
        errors.push({ field: 'editMinAmountError', message: 'Minimum amount cannot be negative.' });
    }

    if (data.maxAmount < 0) {
        errors.push({ field: 'editMaxAmountError', message: 'Maximum amount cannot be negative.' });
    }

    if (data.startDate < today) {
        errors.push({ field: 'editStartDateError', message: 'Start date cannot be in the past.' });
    }

    if (data.endDate < data.startDate) {
        errors.push({ field: 'editEndDateError', message: 'End date cannot be before start date.' });
    }

    if (data.minAmount < data.discountAmount) {
        errors.push({ field: 'editMinAmountError', message: 'Minimum amount cannot be less than the discount amount.' });
    }

    if (data.maxAmount < data.minAmount) {
        errors.push({ field: 'editMaxAmountError', message: 'Maximum amount cannot be less than the minimum amount.' });
    }

    return errors;
}






// Open the edit coupon modal
function formatDateToInputValue(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; 
}

function openEditCouponModal(id, code, discountType, discountAmount, minAmount, maxAmount, startDate, endDate) {
    document.getElementById('editCouponModal').style.display = 'block';
    document.getElementById('editCouponId').value = id;
    document.getElementById('editCouponCode').value = code;
    document.getElementById('editDiscountType').value = discountType;
    document.getElementById('editDiscountAmount').value = discountAmount;
    document.getElementById('editMinAmount').value = minAmount || 0;
    document.getElementById('editMaxAmount').value = maxAmount || 0;

    // Format dates correctly
    document.getElementById('editStartDate').value = formatDateToInputValue(startDate);
    document.getElementById('editEndDate').value = formatDateToInputValue(endDate);

    clearEditErrorMessages();
}



// Close the edit coupon modal
function closeEditModal() {
    document.getElementById('editCouponModal').style.display = 'none';
}

// Handle edit form submission
document.getElementById('editCouponForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    clearEditErrorMessages();

    const couponData = {
        couponId: document.getElementById('editCouponId').value,
        couponCode: document.getElementById('editCouponCode').value,
        discountType: document.getElementById('editDiscountType').value,
        discountAmount: parseFloat(document.getElementById('editDiscountAmount').value),
        minAmount: parseFloat(document.getElementById('editMinAmount').value),
        maxAmount: parseFloat(document.getElementById('editMaxAmount').value),
        startDate: document.getElementById('editStartDate').value,
        endDate: document.getElementById('editEndDate').value,
    };

    const validationErrors = validateEditCouponData(couponData);
    
    if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
            
            document.getElementById(error.field).innerText = error.message;
        });
        return;
    }

    try {
        const response = await axios.patch(`/admin/coupons/edit/${couponData.couponId}`, couponData);
        await Swal.fire({
            title: 'Success!',
            text: response.data.message,
            icon: 'success',
            confirmButtonText: 'OK'
        });
        location.reload()
        closeEditModal();
    } catch (error) {
        await Swal.fire({
            title: 'Error!',
            text: error.response.data.message || 'Error editing coupon',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});

// Clear edit error messages
function clearEditErrorMessages() {
    document.getElementById('editCouponCodeError').innerText = '';
    document.getElementById('editDiscountTypeError').innerText = '';
    document.getElementById('editDiscountAmountError').innerText = '';
    document.getElementById('editMinAmountError').innerText = '';
    document.getElementById('editMaxAmountError').innerText = '';
    document.getElementById('editEndDateError').innerText = '';
}




// Function to delete a coupon
async function deleteCoupon(couponId) {
    const { value: confirmed } = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    });

    if (confirmed) {
        try {
            const response = await axios.delete(`/admin/coupons/delete/${couponId}`);
            Swal.fire({
                icon: 'success',
                title: response.data.message,
                showConfirmButton: false,
                timer: 1500
            });
            location.reload(); 
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error deleting coupon',
                text: error.response.data.message || 'An unexpected error occurred.'
            });
        }
    }
}

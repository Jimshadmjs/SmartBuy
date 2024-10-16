    function openOfferModal() {
        document.getElementById('offerId').value = ''; // Reset for adding new offer
        document.getElementById('offerName').value = '';
        document.getElementById('discount').value = '';
        document.getElementById('targetType').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('modalTitle').textContent = 'Add Offer';
        clearCategorySelection(); // Clear previous category selections
        updateProducts(); 
        document.getElementById('offerModal').style.display = 'block';
    }

    function closeModal() {
        document.getElementById('offerModal').style.display = 'none'; 
        clearErrors();
    }

    function clearErrors() {
        document.getElementById('offerNameError').innerText = '';
        document.getElementById('discountError').innerText = '';
        document.getElementById('targetTypeError').innerText = '';
        document.getElementById('productSelectError').innerText = '';
        document.getElementById('categorySelectError').innerText = '';
    }

    function clearCategorySelection() {
        const categorySelectContainer = document.getElementById('categorySelectContainer');
        categorySelectContainer.innerHTML = ''; // Clear previous selections
        categorySelectContainer.style.display = 'none'; // Hide by default
    }

    function validateForm() {
        let isValid = true;
        clearErrors();

        const offerName = document.getElementById('offerName').value;
        const discount = document.getElementById('discount').value;
        const targetType = document.getElementById('targetType').value;
        const selectedProducts = Array.from(document.querySelectorAll('input[name="productSelect"]:checked')).map(input => input.value);
        const selectedCategory = Array.from(document.querySelectorAll('input[name="categorySelect"]:checked')).map(input => input.value);
        
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);

        if (!offerName || /^[^a-zA-Z0-9]+$/.test(offerName)) {
            document.getElementById('offerNameError').innerText = 'Offer name cannot be empty or contain only special characters.';
            isValid = false;
        }

        if (discount < 0) {
            document.getElementById('discountError').innerText = 'Discount cannot be a negative value.';
            isValid = false;
        }

        if (!targetType) {
            document.getElementById('targetTypeError').innerText = 'Please select a target type.';
            isValid = false;
        }

        if (targetType === 'Product' && selectedProducts.length === 0) {
            document.getElementById('productSelectError').innerText = 'Please select at least one product.';
            isValid = false;
        } else if (targetType === 'Category' && selectedCategory.length === 0) {
            document.getElementById('categorySelectError').innerText = 'Please select a category.';
            isValid = false;
        }

        // Check if the end date is before the start date
        if (endDate < startDate) {
            document.getElementById('endDateError').innerText = 'End date cannot be before the start date.';
            isValid = false;
        }

        return isValid;
    }

    document.getElementById('offerForm').onsubmit = function(e) {
        e.preventDefault();
        if (validateForm()) {
            const offerData = {
                title: document.getElementById('offerName').value,
                discountAmount: document.getElementById('discount').value,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                targetType: document.getElementById('targetType').value,
                selectedProducts: Array.from(document.querySelectorAll('input[name="productSelect"]:checked')).map(input => input.value),
                selectedCategory: Array.from(document.querySelectorAll('input[name="categorySelect"]:checked')).map(input => input.value) // Collect selected category
            };
            console.log(offerData);
            
            axios.post('/admin/offers/add', offerData)
                .then(response => {
                    console.log('Offer saved successfully:', response.data);
                    closeModal();
                    // Optionally refresh the offer list or handle the response as needed
                })
                .catch(error => {
                    console.error('Error saving offer:', error);
                });
        }
    };

    function updateProducts() {
        const targetType = document.getElementById('targetType').value;
        const productSelectContainer = document.getElementById('productSelectContainer');
        const categorySelectContainer = document.getElementById('categorySelectContainer');

        productSelectContainer.innerHTML = ''; // Clear previous product selections
        categorySelectContainer.innerHTML = ''; // Clear previous category selections
        categorySelectContainer.style.display = 'none'; // Hide category select by default

        if (targetType) {
            const url = targetType === 'Category' ? '/admin/categories' : '/admin/products'; 

            if (targetType === 'Category') {
                categorySelectContainer.style.display = 'block'; // Show category select
                // Fetch and populate categories here
                axios.get(url)
                    .then(response => {
                        const categories = response.data; // Assuming response.data is an array of categories
                        categories.forEach(category => {
                            const radio = document.createElement('input');
                            radio.type = 'radio'; // Use radio buttons for single selection
                            radio.name = 'categorySelect'; // Name for single selection
                            radio.value = category._id; // Assuming category._id is the ObjectId
                            const label = document.createElement('label');
                            label.textContent = category.name;

                            categorySelectContainer.appendChild(radio);
                            categorySelectContainer.appendChild(label);
                            categorySelectContainer.appendChild(document.createElement('br'));
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching categories:', error);
                    });
            } else {
                // Fetch and populate products
                axios.get(url)
                    .then(response => {
                        const products = response.data; // Assuming response.data is an array of products
                        products.forEach(product => {
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox'; // Use checkboxes for multiple selection
                            checkbox.name = 'productSelect'; // Name for multiple selection
                            checkbox.value = product._id; // Assuming product._id is the ObjectId
                            const label = document.createElement('label');
                            label.textContent = product.name;

                            productSelectContainer.appendChild(checkbox);
                            productSelectContainer.appendChild(label);
                            productSelectContainer.appendChild(document.createElement('br'));
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching products:', error);
                    });
            }
        }
    }






    function openEditOfferModal(id, title, discount, targetType, startDate, endDate, selectedProducts = [], selectedCategories = []) {
        document.getElementById('editOfferId').value = id; 
        document.getElementById('editOfferName').value = title;
        document.getElementById('editDiscount').value = discount;
        document.getElementById('editTargetType').value = targetType;
    
        document.getElementById('editStartDate').value = formatDateToInput(startDate);
        document.getElementById('editEndDate').value = formatDateToInput(endDate);
        
        document.getElementById('editModalTitle').textContent = 'Edit Offer';
    
        updateEditProducts(targetType, selectedProducts, selectedCategories);
        
        document.getElementById('editOfferModal').style.display = 'block';
    }
    
    function formatDateToInput(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }
    
    function updateEditProducts(targetType, selectedProducts, selectedCategories) {
        const editProductSelectContainer = document.getElementById('editProductSelectContainer');
        const editCategorySelectContainer = document.getElementById('editCategorySelectContainer');
    
        editProductSelectContainer.innerHTML = ''; 
        editCategorySelectContainer.innerHTML = ''; 
        editCategorySelectContainer.style.display = 'none';
    
        if (targetType) {
            const url = targetType === 'Category' ? '/admin/categories' : '/admin/products';
    
            if (targetType === 'Category') {
                editCategorySelectContainer.style.display = 'block'; 
                axios.get(url)
                    .then(response => {
                        const categories = response.data;
                        categories.forEach(category => {
                            const radio = document.createElement('input');
                            radio.type = 'radio';
                            radio.name = 'editCategorySelect';
                            radio.value = category._id;
                            radio.checked = selectedCategories.includes(category._id);
    
                            const label = document.createElement('label');
                            label.textContent = category.name;
    
                            editCategorySelectContainer.appendChild(radio);
                            editCategorySelectContainer.appendChild(label);
                            editCategorySelectContainer.appendChild(document.createElement('br'));
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching categories:', error);
                    });
            } else {
                axios.get(url)
                    .then(response => {
                        const products = response.data;
                        products.forEach(product => {
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.name = 'editProductSelect';
                            checkbox.value = product._id;
                            checkbox.checked = selectedProducts.includes(product._id);
    
                            const label = document.createElement('label');
                            label.textContent = product.name;
    
                            editProductSelectContainer.appendChild(checkbox);
                            editProductSelectContainer.appendChild(label);
                            editProductSelectContainer.appendChild(document.createElement('br'));
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching products:', error);
                    });
            }
        }
    }
    
    function closeEditModal() {
        document.getElementById('editOfferModal').style.display = 'none'; 
        clearEditErrors();
    }
    
    function clearEditErrors() {
        document.getElementById('editOfferNameError').innerText = '';
        document.getElementById('editDiscountError').innerText = '';
        document.getElementById('editTargetTypeError').innerText = '';
        document.getElementById('editProductSelectError').innerText = '';
        document.getElementById('editCategorySelectError').innerText = '';
    }
    
    document.getElementById('editTargetType').addEventListener('change', function() {
        const targetType = this.value;
        const selectedProducts = Array.from(document.querySelectorAll('input[name="editProductSelect"]:checked')).map(input => input.value);
        const selectedCategories = Array.from(document.querySelectorAll('input[name="editCategorySelect"]:checked')).map(input => input.value);
    
        updateEditProducts(targetType, selectedProducts, selectedCategories);
    });
    
    document.getElementById('editOfferForm').onsubmit = function(e) {
        e.preventDefault();
        if (validateEditForm()) {
            const offerData = {
                id: document.getElementById('editOfferId').value,
                title: document.getElementById('editOfferName').value,
                discountAmount: document.getElementById('editDiscount').value,
                startDate: document.getElementById('editStartDate').value,
                endDate: document.getElementById('editEndDate').value,
                targetType: document.getElementById('editTargetType').value,
                selectedProducts: Array.from(document.querySelectorAll('input[name="editProductSelect"]:checked')).map(input => input.value),
                selectedCategory: Array.from(document.querySelectorAll('input[name="editCategorySelect"]:checked')).map(input => input.value)
            };
    
            axios.patch('/admin/offers/edit', offerData)
                .then(response => {
                    console.log('Offer updated successfully:', response.data);
                    closeEditModal();
                })
                .catch(error => {
                    console.error('Error updating offer:', error);
                });
        }
    };
    
    
    function validateEditForm() {
        return true; 
    }
    
    
    
    function toggleOfferStatus(id, isActive) {
        const action = isActive ? 'activate' : 'deactivate';
        
        const url = `/admin/offers/${action}`;
        axios.patch(url, { id })
            .then(response => {
                console.log(response.data.message);
                location.reload()
            })
            .catch(error => {
                console.error('Error toggling offer status:', error);
            });
    }
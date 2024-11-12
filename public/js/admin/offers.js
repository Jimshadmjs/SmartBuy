
    // to add offer
    function openOfferModal() {
        document.getElementById('offerId').value = '';
        document.getElementById('offerName').value = '';
        document.getElementById('discount').value = '';
        document.getElementById('targetType').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('modalTitle').textContent = 'Add Offer';
        clearCategorySelection();
        updateProducts();
        document.getElementById('offerModal').style.display = 'block';
    }
    
    function closeModal() {
        document.getElementById('offerModal').style.display = 'none';
        clearErrors();
    }
    
    function clearErrors() {
        const errorIds = ['offerNameError', 'discountError', 'targetTypeError', 'productSelectError', 'categorySelectError', 'endDateError'];
        errorIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerText = '';
            }
        });
    }
    
    function clearCategorySelection() {
        const categorySelectContainer = document.getElementById('categorySelectContainer');
        categorySelectContainer.innerHTML = '';
        categorySelectContainer.style.display = 'none';
    }
    
    function validateForm() {
        let isValid = true;
        clearErrors();
    
        const offerName = document.getElementById('offerName').value;
        const discount = document.getElementById('discount').value;
        const targetType = document.getElementById('targetType').value;
        const selectedProducts = Array.from(document.querySelectorAll('#productSelect option:checked')).map(option => option.value);
        const selectedCategory = Array.from(document.querySelectorAll('#categorySelect option:checked')).map(option => option.value);
        
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
    
        if (endDate < startDate) {
            document.getElementById('endDateError').innerText = 'End date cannot be before the start date.';
            isValid = false;
        }

        if(discount > 99){
            document.getElementById('discountError').innerText = 'Discount cannot be more tha 99% .';
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
                selectedProducts: Array.from(document.querySelectorAll('#productSelect option:checked')).map(option => option.value),
                selectedCategory: Array.from(document.querySelectorAll('#categorySelect option:checked')).map(option => option.value)
            };
            
            axios.post('/admin/offers/add', offerData)
                .then(response => {
                    closeModal();
                    location.reload()
                })
                .catch(error => {
                });
        }
    };
    
    function updateProducts() {
        const targetType = document.getElementById('targetType').value;
        const productSelectContainer = document.getElementById('productSelectContainer');
        const categorySelectContainer = document.getElementById('categorySelectContainer');
    
        productSelectContainer.style.display = 'none';
        categorySelectContainer.style.display = 'none';
    
        if (targetType) {
            const url = targetType === 'Category' ? '/admin/categories' : '/admin/products';
    
            const selectElement = document.createElement('select');
            selectElement.id = targetType === 'Category' ? 'categorySelect' : 'productSelect';
            selectElement.multiple = true; 
            selectElement.style.width = '100%';
    
            (targetType === 'Category' ? categorySelectContainer : productSelectContainer).innerHTML = ''; 
            (targetType === 'Category' ? categorySelectContainer : productSelectContainer).appendChild(selectElement);
            (targetType === 'Category' ? categorySelectContainer : productSelectContainer).style.display = 'block'; 
    
            axios.get(url)
                .then(response => {
                    const items = response.data; 
                    items.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item._id; 
                        option.textContent = item.name;
                        selectElement.appendChild(option);
                    });
    
                    addSearchFunctionality(selectElement);
                })
                .catch(error => {
                });
        }
    }
    
    function addSearchFunctionality(selectElement) {
        const searchInput = document.createElement('input');
        searchInput.placeholder = 'Search...';
        searchInput.style.width = '100%'; 
    
        searchInput.addEventListener('input', function() {
            const filter = searchInput.value.toLowerCase();
            const options = selectElement.options;
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                option.style.display = option.text.toLowerCase().includes(filter) ? '' : 'none';
            }
        });
    
        selectElement.parentNode.insertBefore(searchInput, selectElement);
    }
    
    
    
    
    // to edit offer
    
    
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
        const productSelect = document.getElementById('editProductSelect');
        const categorySelect = document.getElementById('editCategorySelect');
    
        editProductSelectContainer.style.display = 'none';
        editCategorySelectContainer.style.display = 'none';
    
        if (targetType) {
            const url = targetType === 'Category' ? '/admin/categories' : '/admin/products';
    
            if (targetType === 'Category') {
                editCategorySelectContainer.style.display = 'block';
                fetchOptions(url, categorySelect, selectedCategories);
            } else {
                editProductSelectContainer.style.display = 'block';
                fetchOptions(url, productSelect, selectedProducts);
            }
        }
    }
    
    function fetchOptions(url, selectElement, selectedValues) {
        selectElement.innerHTML = ''; 
    
        if (!selectElement.previousElementSibling || !selectElement.previousElementSibling.classList.contains('search-input')) {
            const searchInput = document.createElement('input');
            searchInput.placeholder = 'Search...';
            searchInput.classList.add('search-input');
            searchInput.style.width = '100%'; 
            searchInput.addEventListener('input', function() {
                const filter = searchInput.value.toLowerCase();
                const options = selectElement.options;
                for (let i = 0; i < options.length; i++) {
                    const option = options[i];
                    option.style.display = option.text.toLowerCase().includes(filter) ? '' : 'none';
                }
            });
    
            // Insert search input above the select element
            selectElement.parentNode.insertBefore(searchInput, selectElement);
        }
    
        // Fetch the data
        axios.get(url)
            .then(response => {
                const items = response.data;
                items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item._id; 
                    option.textContent = item.name; 
                    option.selected = selectedValues.includes(item._id);
                    selectElement.appendChild(option);
                });
            })
            .catch(error => {
            });
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
        const selectedProducts = Array.from(document.querySelectorAll('#editProductSelect option:checked')).map(option => option.value);
        const selectedCategories = Array.from(document.querySelectorAll('#editCategorySelect option:checked')).map(option => option.value);
    
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
                selectedProducts: Array.from(document.querySelectorAll('#editProductSelect option:checked')).map(option => option.value),
                selectedCategories: Array.from(document.querySelectorAll('#editCategorySelect option:checked')).map(option => option.value)
            };
    
            axios.patch('/admin/offers/edit', offerData)
                .then(response => {
                    location.reload()
                    closeEditModal();
                })
                .catch(error => {
                });
        }
    };
    
    function validateEditForm() {
        let isValid = true;
        clearEditErrors();
    
        const offerName = document.getElementById('editOfferName').value;
        const discount = document.getElementById('editDiscount').value;
        const targetType = document.getElementById('editTargetType').value;
    
        if (!offerName || /^[^a-zA-Z0-9]+$/.test(offerName)) {
            document.getElementById('editOfferNameError').innerText = 'Offer name cannot be empty or contain only special characters.';
            isValid = false;
        }
    
        if (discount < 0) {
            document.getElementById('editDiscountError').innerText = 'Discount cannot be a negative value.';
            isValid = false;
        }
    
        if (!targetType) {
            document.getElementById('editTargetTypeError').innerText = 'Please select a target type.';
            isValid = false;
        }
    
        return isValid;
    }
    
    



    function toggleOfferStatus(id, isActive) {
        const action = isActive ? 'activate' : 'deactivate';
        const actionText = isActive ? 'Activate' : 'Deactivate';
    
        Swal.fire({
            title: `Are you sure you want to ${actionText} this offer?`,
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, proceed!'
        }).then((result) => {
            if (result.isConfirmed) {
                const url = `/admin/offers/${action}`;
                axios.patch(url, { id })
                    .then(response => {
                        Swal.fire({
                            title: 'Success!',
                            text: response.data.message,
                            icon: 'success',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            location.reload();
                        });
                    })
                    .catch(error => {
                        Swal.fire(
                            'Error!',
                            'There was an issue changing the offer status.',
                            'error'
                        );
                    });
            }
        });
    }
    
    
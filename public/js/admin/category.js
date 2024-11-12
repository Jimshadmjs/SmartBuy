// Get modal elements
const addModal = document.getElementById("addCategoryModal");
const editModal = document.getElementById("editCategoryModal");
const addBtn = document.getElementById("addCategoryBtn");
const closeAddSpan = document.getElementById("closeAddModal");
const closeEditSpan = document.getElementById("closeEditModal");
const addErrorMessage = document.getElementById("addErrorMessage");
const editErrorMessage = document.getElementById("editErrorMessage");
const msg = document.getElementById("msg");

// Function to open the add modal
addBtn.onclick = function() {
    addModal.style.display = "flex"; // Use flex to center the modal
    addErrorMessage.style.display = "none"; // Hide error message on open
}

// Function to close modals
const closeModal = (modal) => {
    modal.style.display = "none";
}

// Close the add modal when the user clicks on <span> (x)
closeAddSpan.onclick = () => closeModal(addModal);

// Close the edit modal when the user clicks on <span> (x)
closeEditSpan.onclick = () => closeModal(editModal);

// Close the modal when clicking outside of it
window.onclick = function(event) {
    if (event.target === addModal || event.target === editModal) {
        closeModal(addModal);
        closeModal(editModal);
    }
}

// Handle add category form submission
document.getElementById("addCategoryForm").onsubmit = function(event) {
    event.preventDefault(); // Prevent default form submission
    const categoryName = document.getElementById("addCategoryName").value.trim();

    if (categoryName === "") {
        addErrorMessage.style.display = "block"; // Show error message
        setTimeout(() => { addErrorMessage.style.display = "none"; }, 3000);
    } else {
        this.submit(); // Submit the form to the action URL
    }
}

// Clear message after a few seconds
if (msg) {
    setTimeout(() => { msg.innerHTML = ""; }, 3000);
}

// Function to update category status
const updateCategoryStatus = async (categoryId, isListed) => {
    const url = `/admin/category/${categoryId}`;
    const data = { isListed: !isListed };

    try {
        const response = await axios.patch(url, data);
        location.reload();
    } catch (error) {
        console.error('Error updating category status:', error);
    }
};

// Attach event listeners to category status buttons
document.querySelectorAll('.unlist-btn-category, .list-btn-category').forEach(button => {
    button.addEventListener('click', (event) => {
        const categoryId = event.target.getAttribute('data-category-id'); 
        const isListed = event.target.classList.contains('unlist-btn-category'); 

        const action = isListed ? 'Unlist' : 'List';
        const confirmation = confirm(`Are you sure you want to ${action} this category?`);

        if (confirmation) {
            updateCategoryStatus(categoryId, isListed); 
        }
    });
});





// Function to open edit modal and populate fields
function openEditModal(categoryId, categoryName) {
    document.getElementById("editCategoryId").value = categoryId; // Set the category ID
    document.getElementById("editCategoryName").value = categoryName; // Set the category name
    document.getElementById("editCategoryModal").style.display = "flex"; // Show the modal
    document.getElementById("editErrorMessage").style.display = "none"; // Hide error message
}

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function() {
    // Attach event listener to save button
    const saveEditChangesBtn = document.getElementById("saveEditChangesBtn");
    saveEditChangesBtn.addEventListener("click", clicked);
});

// Handle save changes button click
async function clicked() {
    const categoryId = document.getElementById("editCategoryId").value;
    const categoryName = document.getElementById("editCategoryName").value.trim();
    const editErrorMessage = document.getElementById("editErrorMessage");

    if (categoryName === "") {
        editErrorMessage.style.display = "block";
        setTimeout(() => {
            editErrorMessage.style.display = "none";
        }, 3000);
        return;
    } else {
        editErrorMessage.style.display = "none";
    }

    try {
        const url = `/admin/category/edit/${categoryId}`;
        await axios.patch(url, { name: categoryName });
        closeEditModal();
        location.reload(); 
    } catch (error) {
        editErrorMessage.style.display = "block"; 
        editErrorMessage.innerText = "Failed to update category. Please try again.";
    }
}

function closeEditModal() {
    const editModal = document.getElementById("editCategoryModal");
    editModal.style.display = "none";
}
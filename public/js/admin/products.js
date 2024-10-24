










function toggleProduct(productId) {
    console.log(productId);
  // Select the button using the data-id attribute
  const isListedButton = document.querySelector(`button[data-id='${productId}']`);

  // Determine current listing state
  const isListed = isListedButton.classList.contains('listed');
  const confirmation = confirm(`Are you sure you want to ${isListed} this product?`);

if(confirmation){
  // Send request to the backend to toggle listing state
  axios.post(`/admin/products/${productId}`, { isListed: !isListed })
    .then(response => {

      if (response.data.success) {
        // Update the button text and class based on the new state
        isListedButton.classList.toggle('listed', !isListed);
        isListedButton.classList.toggle('unlisted', isListed);
        isListedButton.textContent = isListed ? 'List' : 'Unlist';
      } else {
        alert(response.data.message || 'Error updating product status.');
      }
    })
    .catch(error => {
      console.error('Error toggling product listing:', error);
      alert('An error occurred while updating the product status. Please try again.');
   });
}
}
  





// add product

function base64ToFile(base64, filename) {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
}

let croppers = []; 
let croppedImages = []; 


function initializeCropper(input, index) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imgElement = document.getElementById(`image-preview-${index}`);
            const croppedImage = document.getElementById(`croppedImage-${index}`);
            imgElement.src = e.target.result;
            imgElement.style.display = "block";

            
            if (croppers[index]) {
                croppers[index].destroy(); 
            }

            croppers[index] = new Cropper(imgElement, {
                aspectRatio: 1, 
                viewMode: 1,
                background: false,
            });
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Crop the image and replace the preview with the cropped version
function cropImage(index) {
    console.log(index);
    const cropper = croppers[index];
    if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas();
        // Convert the cropped image to a base64 string for JSON submission
        const base64Image = croppedCanvas.toDataURL("image/jpeg");
        console.log("diid");
        
        croppedImages[index] = base64Image; // Store base64 image in the array

        // Convert Base64 to File
        const file = base64ToFile(croppedImages[index],` image[${index}].png`);
        console.log("diid");

        // Create a DataTransfer object to set the file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // Set the file input's files to the DataTransfer object
        const fileInput = document.getElementById(`croppedImage-${index}`);
        fileInput.files = dataTransfer.files;

        // Replace the canvas with the actual cropped image preview
        const imgElement = document.getElementById(`image-preview-${index}`);
        imgElement.src = base64Image; // Set the cropped image as the new source
        imgElement.style.display = "block"; // Ensure it's visible

        // Destroy the cropper instance
        cropper.destroy();
        croppers[index] = null; // Clear the cropper instance
    }
}

// Add more image upload inputs dynamically
document.getElementById("add-image-btn").addEventListener("click", function () {
    const container = document.getElementById("image-upload-container");
    const newIndex = container.getElementsByClassName("image-upload").length;

    const newImageUpload = `
        <div class="image-upload">
            <input type="file" accept="image/*" class="image-input" onchange="initializeCropper(this, ${newIndex})">
            <input type="file" name="croppedImage[]" id="croppedImage-${newIndex}" accept="image/*" hidden/>
            <img id="image-preview-${newIndex}" class="image-preview" style="display:none; max-width: 200px;"/>
            <button type="button" class="crop-btn" onclick="cropImage(${newIndex})">Crop</button>
            <input type="radio" name="primaryImageIndex" value="${newIndex}"> Set as Primary
        </div>
    `;
    container.insertAdjacentHTML("beforeend", newImageUpload);
});

const error = document.getElementById("error");
if (error) {
    setTimeout(() => {
        error.style.display = "none";
    }, 3000);
    
}
function reload(){
document.getElementById('addProductModal').style.display = 'none';
location.reload()

    }

    // Modal handling
document.getElementById('addProductBtn').addEventListener('click', function () {
document.getElementById('addProductModal').style.display = 'block';
});



function closeModal() {
document.getElementById('addProductModal').style.display = 'none';
}




// add product modal validation

function validateForm() {
  let isValid = true;

  // Clear previous error messages
  document.querySelectorAll('.error-message').forEach(el => el.innerHTML = '');

  // Validate product name
  const name = document.getElementById('name').value.trim();
  const namePattern = /^(?=.*[a-zA-Z0-9]).+$/; // At least one alphanumeric character
  if (!namePattern.test(name)) {
      document.getElementById('nameError').innerHTML = 'Product name must contain at least one letter or number.';
      isValid = false;
      setTimeout(() => {
          document.getElementById('nameError').innerHTML = '';
      }, 3000);
  }

  // Validate description
  const description = document.getElementById('description').value.trim();
  if (description === '') {
      document.getElementById('descriptionError').innerHTML = 'Product description is required.';
      isValid = false;
      setTimeout(() => {
          document.getElementById('descriptionError').innerHTML = '';
      }, 3000);
  }

  // Validate category
  const categoryID = document.getElementById('categoryID').value;
  if (!categoryID) {
      document.getElementById('categoryError').innerHTML = 'Please select a category.';
      isValid = false;
      setTimeout(() => {
          document.getElementById('categoryError').innerHTML = '';
      }, 3000);
  }

  // Validate stock (must be a positive number)
  const stock = document.getElementById('stock').value;
  if (stock === '' || stock <= 0) {
      document.getElementById('stockError').innerHTML = 'Please enter a valid stock number.';
      isValid = false;
      setTimeout(() => {
          document.getElementById('stockError').innerHTML = '';
      }, 3000);
  }

  // Validate price (must be a positive number)
  const price = document.getElementById('price').value;
  if (price === '' || price <= 0) {
      document.getElementById('priceError').innerHTML = 'Please enter a valid price.';
      isValid = false;
      setTimeout(() => {
          document.getElementById('priceError').innerHTML = '';
      }, 3000);
  }

  // Validate colors (optional, but should not be empty if filled)
  const colors = document.getElementById('colors').value.trim();
  if (colors && !/^[a-zA-Z\s,]+$/.test(colors)) {
      document.getElementById('colorsError').innerHTML = 'Colors must be comma-separated words.';
      isValid = false;
      setTimeout(() => {
          document.getElementById('colorsError').innerHTML = '';
      }, 3000);
  }

     // Validate image uploads (minimum 3 images required)
     const imageInputs = document.querySelectorAll('.image-input');
     if (imageInputs.length < 3) {
         document.getElementById('imageError').innerHTML = 'Please upload at least 3 images.';
         isValid = false;
         setTimeout(() => {
             document.getElementById('imageError').innerHTML = '';
         }, 3000);
     } else {
         // Validate image types
         imageInputs.forEach(input => {
             const file = input.files[0];
             if (file) {
                 const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
                 if (!validImageTypes.includes(file.type)) {
                     document.getElementById('imageError').innerHTML = 'Please upload valid image files (JPEG, PNG, GIF).';
                     isValid = false;
                     setTimeout(() => {
                         document.getElementById('imageError').innerHTML = '';
                     }, 3000);
                 }
             }
         });
     }

  return isValid;
}

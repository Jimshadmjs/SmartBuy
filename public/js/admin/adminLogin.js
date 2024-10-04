document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordField = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
});

// Form validation
document.getElementById('loginForm').addEventListener('submit', function (event) {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.style.display = 'none'; // Hide previous error messages

    if (!email || !password) {
        errorMessage.textContent = 'Both fields are required.';
        errorMessage.style.display = 'block';
        event.preventDefault(); // Prevent form submission
    } else if (!validateEmail(email)) {
        errorMessage.textContent = 'Please enter a valid email address.';
        errorMessage.style.display = 'block';
        event.preventDefault(); // Prevent form submission
    }
});

// Email validation function
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

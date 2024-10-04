const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const togglePasswordButton = document.getElementById('togglePassword');
const toggleConfirmPasswordButton = document.getElementById('toggleConfirmPassword');
const form = document.getElementById('createAccountForm');
const usernameInput = document.getElementById('username'); // Username input

// Toggle password visibility
[togglePasswordButton, toggleConfirmPasswordButton].forEach(button => {
    button.addEventListener('click', function () {
        const input = button.id === 'togglePassword' ? passwordInput : confirmPasswordInput;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
    });
});

// Validation functions
const validators = {
    username: (value) => /^[a-zA-Z0-9_]{3,16}$/.test(value), // Username validation
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    password: (value) => /^(?=.*[0-9])(?=.*[!@#$%^&])[a-zA-Z0-9!@#$%^&]{8,}$/.test(value),
    confirmPassword: (password, confirmPassword) => password === confirmPassword && confirmPassword.length > 0
};

// Real-time validation
const validateInput = (input, validator, ...args) => {
    const isValid = validator(...args);
    const errorElement = document.getElementById(`${input.id}Error`);
    errorElement.style.display = isValid ? 'none' : 'block';
    input.classList.toggle('valid-blink', isValid);
    return isValid;
};

// Add event listeners for username input
usernameInput.addEventListener('input', () => validateInput(usernameInput, validators.username, usernameInput.value));
emailInput.addEventListener('input', () => validateInput(emailInput, validators.email, emailInput.value));
passwordInput.addEventListener('input', () => {
    validateInput(passwordInput, validators.password, passwordInput.value);
    validateInput(confirmPasswordInput, validators.confirmPassword, passwordInput.value, confirmPasswordInput.value);
});
confirmPasswordInput.addEventListener('input', () => validateInput(confirmPasswordInput, validators.confirmPassword, passwordInput.value, confirmPasswordInput.value));

// Final form validation on submit
form.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default submission

    // Validate each field
    const isUsernameValid = validateInput(usernameInput, validators.username, usernameInput.value);
    const isEmailValid = validateInput(emailInput, validators.email, emailInput.value);
    const isPasswordValid = validateInput(passwordInput, validators.password, passwordInput.value);
    const isConfirmPasswordValid = validateInput(confirmPasswordInput, validators.confirmPassword, passwordInput.value, confirmPasswordInput.value);

    // If all validations pass, submit the form
    if (isUsernameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {

        // Submit the form programmatically
        form.submit();
    }
});

const err = document.getElementById('msg')

if(err.innerHTML){
    setTimeout(()=>{
        err.innerHTML = ""
    },3000)
}
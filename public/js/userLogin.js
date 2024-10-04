document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('createAccountForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const msgElement = document.getElementById('msg');

    // Remove message after 3 seconds
    if (msgElement.textContent) {
        setTimeout(() => {
            msgElement.textContent = '';
        }, 3000);
    }

    const togglePassword = document.getElementById('togglePassword');

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('active');
    });

    form.addEventListener('submit', function(event) {
        // Check for empty fields
        if (!emailInput.value.trim() || !passwordInput.value.trim()) {
            event.preventDefault(); // Prevent form submission
            msgElement.textContent = "All fields are required"
        }
    });
});

let timerElement = document.getElementById("timer");
const otpInputs = document.querySelectorAll('.otp-input');
let resendLink = document.getElementById("resendLink");
let msg = document.getElementById('msg');

// Check if there is a time left in local storage
let timeLeft = localStorage.getItem('otpTime') ? parseInt(localStorage.getItem('otpTime')) : 60;

// Function to update the timer display
function updateTimerDisplay() {
    timerElement.innerText = `${timeLeft}s`;
}

// Focus on the next input field when one is filled
otpInputs.forEach((input, index) => {
    input.addEventListener('input', () => {
        if (!/^[0-9]*$/.test(input.value)) {
            input.value = ''; 
            return; 
        }

        // Move to the next input field if filled
        if (input.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && index > 0 && input.value.length === 0) {
            otpInputs[index - 1].focus();
        }
    });
});

// Timer for OTP resend
let timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerElement.innerText = "0s";
        resendLink.style.display = "block"; 
        localStorage.removeItem('otpTime'); // Clear the time from storage
    } else {
        timeLeft--;
        localStorage.setItem('otpTime', timeLeft); // Update the time in storage
        updateTimerDisplay();
    }
}, 1000);

// Update the display initially
updateTimerDisplay();

// Validate OTP form
function validateForm() {
    const inputs = document.querySelectorAll('.otp-input');
    for (const input of inputs) {
        if (input.value === '') {
            msg.innerHTML = 'Please fill in all fields.';
            setTimeout(() => {
                msg.innerHTML = ''; 
            }, 3000);
            return false; 
        }
    }

 
    // Clear local storage on successful verification (if this is where you handle it)
    localStorage.removeItem('otpTime');
    return true; 
}

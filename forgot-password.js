function showPopup(message, type) {
    const popup = document.getElementById('toast-popup');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    
    msgEl.textContent = message;
    popup.className = `toast-popup ${type}`;
    
    if (type === 'success') {
        iconEl.className = 'fas fa-check-circle';
    } else {
        iconEl.className = 'fas fa-exclamation-circle';
    }
    
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

const stepPhone = document.getElementById('step-phone');
const stepOtp = document.getElementById('step-otp');
const stepPasswords = document.getElementById('step-passwords');

const btnSendOtp = document.getElementById('btn-send-otp');
const btnVerifyOtp = document.getElementById('btn-verify-otp');
const btnBackPhone = document.getElementById('btn-back-phone');

const phoneInput = document.getElementById('phone');
const otpInput = document.getElementById('otp');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');

let verifiedPhone = "";

btnSendOtp.addEventListener('click', async () => {
    const phone = phoneInput.value;
    if (phone.length !== 10) {
        showPopup("Please enter a valid 10-digit mobile number.", 'error');
        return;
    }

    try {
        const response = await fetch('/api/forgot-password-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await response.json();
        if (data.success) {
            showPopup(data.message, 'success');
            stepPhone.style.display = 'none';
            stepOtp.style.display = 'block';
        } else {
            showPopup(data.message, 'error');
        }
    } catch (err) {
        showPopup('Error requesting OTP.', 'error');
    }
});

btnVerifyOtp.addEventListener('click', async () => {
    const phone = phoneInput.value;
    const otp = otpInput.value;
    
    if (!otp) {
        showPopup("Please enter the OTP.", 'error');
        return;
    }

    try {
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
        });
        const data = await response.json();
        if (data.success) {
            showPopup(data.message, 'success');
            verifiedPhone = phone;
            stepOtp.style.display = 'none';
            stepPasswords.style.display = 'block';
        } else {
            showPopup(data.message, 'error');
        }
    } catch (err) {
        showPopup('Error verifying OTP.', 'error');
    }
});

btnBackPhone.addEventListener('click', (e) => {
    e.preventDefault();
    stepOtp.style.display = 'none';
    stepPhone.style.display = 'block';
});

document.getElementById('forgot-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Process submit only if in final step
    if (stepPasswords.style.display === 'none') return;

    const phone = verifiedPhone;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
        showPopup("Passwords do not match.", 'error');
        return;
    }

    if (password.length < 6) {
        showPopup("Password must be at least 6 characters long.", 'error');
        return;
    }

    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showPopup("Password reset successful! Redirecting...", 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showPopup(data.message, 'error');
        }
    } catch (err) {
        console.error('Reset error:', err);
        showPopup('An error occurred. Please try again later.', 'error');
    }
});

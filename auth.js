// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');
const tabBtns = document.querySelectorAll('.tab-btn');

// Form switching functions
function showLogin() {
  loginForm.classList.add('active');
  registerForm.classList.remove('active');
  tabBtns[0].classList.add('active');
  tabBtns[1].classList.remove('active');
  clearMessage();
}

function showRegister() {
  registerForm.classList.add('active');
  loginForm.classList.remove('active');
  tabBtns[1].classList.add('active');
  tabBtns[0].classList.remove('active');
  clearMessage();
}

// Password toggle function
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const toggleBtn = input.nextElementSibling;
  const icon = toggleBtn.querySelector('i');

  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

// Message display functions
function showMessage(message, type = 'error') {
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
}

function clearMessage() {
  messageDiv.style.display = 'none';
}

// Form validation functions
function validateLoginForm() {
  const employeeId = document.getElementById('loginEmployeeId').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!employeeId) {
    showMessage('Please enter your Employee ID');
    return false;
  }

  if (!password) {
    showMessage('Please enter your password');
    return false;
  }

  return true;
}

function validateRegisterForm() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const employeeId = document.getElementById('registerEmployeeId').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const department = document.getElementById('department').value;
  const terms = document.getElementById('terms').checked;

  // Name validation
  if (!firstName || !lastName) {
    showMessage('Please enter your full name');
    return false;
  }

  // Employee ID validation
  if (!employeeId) {
    showMessage('Please enter your Employee ID');
    return false;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    showMessage('Please enter your email address');
    return false;
  }
  if (!emailRegex.test(email)) {
    showMessage('Please enter a valid email address');
    return false;
  }

  // Password validation
  if (!password) {
    showMessage('Please create a password');
    return false;
  }
  if (password.length < 6) {
    showMessage('Password must be at least 6 characters long');
    return false;
  }

  // Confirm password validation
  if (password !== confirmPassword) {
    showMessage('Passwords do not match');
    return false;
  }

  // Department validation
  if (!department) {
    showMessage('Please select your department');
    return false;
  }

  // Terms validation
  if (!terms) {
    showMessage('Please accept the Terms & Conditions');
    return false;
  }

  return true;
}

// Form submission handlers
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  if (!validateLoginForm()) return;

  const submitBtn = loginForm.querySelector('.auth-btn');
  const originalText = submitBtn.textContent;
  submitBtn.classList.add('loading');
  submitBtn.textContent = 'Logging in...';

  try {
    const employeeId = document.getElementById('loginEmployeeId').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Simulate API call - replace with actual authentication
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Temporary credentials for demo
    const validUsers = {
      "EMP001": "1234",
      "EMP002": "abcd",
      "ADMIN": "admin123"
    };

    if (validUsers[employeeId] && validUsers[employeeId] === password) {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      localStorage.setItem('employeeId', employeeId);
      showMessage('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      showMessage('Invalid Employee ID or Password');
    }
  } catch (error) {
    showMessage('Login failed. Please try again.');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.textContent = originalText;
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  if (!validateRegisterForm()) return;

  const submitBtn = registerForm.querySelector('.auth-btn');
  const originalText = submitBtn.textContent;
  submitBtn.classList.add('loading');
  submitBtn.textContent = 'Creating Account...';

  try {
    const formData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      employeeId: document.getElementById('registerEmployeeId').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('registerPassword').value,
      department: document.getElementById('department').value
    };

    // Simulate API call - replace with actual registration
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo purposes, show success message
    showMessage('Account created successfully! You can now login.', 'success');

    // Switch to login form after successful registration
    setTimeout(() => {
      showLogin();
      // Pre-fill login form with registered employee ID
      document.getElementById('loginEmployeeId').value = formData.employeeId;
    }, 2000);

  } catch (error) {
    showMessage('Registration failed. Please try again.');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.textContent = originalText;
  }
});

// Social login handlers (placeholders)
document.querySelectorAll('.google-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    showMessage('Google authentication coming soon!', 'error');
  });
});

document.querySelectorAll('.microsoft-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    showMessage('Microsoft authentication coming soon!', 'error');
  });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check if user was remembered
  if (localStorage.getItem('rememberMe') === 'true' && localStorage.getItem('employeeId')) {
    document.getElementById('loginEmployeeId').value = localStorage.getItem('employeeId');
    document.getElementById('rememberMe').checked = true;
  }
});
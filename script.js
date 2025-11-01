const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

// Forgot Password Modal Elements
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const forgotPasswordModal = document.getElementById("forgotPasswordModal");
const closeModal = document.getElementById("closeModal");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const resetMsg = document.getElementById("resetMsg");

// API Base URL (use relative path so same-origin requests work)
const API_BASE = '/api';

// Login form submission
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const empId = document.getElementById("employeeId").value.trim();
  const password = document.getElementById("password").value.trim();
  const selectedRole = document.querySelector('input[name="userRole"]:checked').value;

  // Clear previous messages
  errorMsg.innerText = "";
  errorMsg.className = "";

  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: empId,
        password: password,
        role: selectedRole
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } else {
      if (selectedRole === 'admin') {
        errorMsg.innerText = "Invalid Admin credentials";
      } else {
        errorMsg.innerText = "Invalid Employee ID or Password";
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMsg.innerText = "Connection error. Please try again.";
  }
});

// Forgot Password Modal Functionality
forgotPasswordLink.addEventListener("click", (e) => {
  e.preventDefault();
  forgotPasswordModal.style.display = "block";
  resetMsg.innerText = "";
  document.getElementById("resetEmployeeId").value = "";
});

closeModal.addEventListener("click", () => {
  forgotPasswordModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === forgotPasswordModal) {
    forgotPasswordModal.style.display = "none";
  }
});

forgotPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const resetEmployeeId = document.getElementById("resetEmployeeId").value.trim();
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword = document.getElementById("confirmNewPassword").value;

  // Clear previous messages
  resetMsg.innerText = "";
  resetMsg.className = "";

  // Validation
  if (!resetEmployeeId) {
    resetMsg.innerText = "Please enter your Employee ID";
    return;
  }

  if (!newPassword) {
    resetMsg.innerText = "Please enter a new password";
    return;
  }

  if (newPassword.length < 4) {
    resetMsg.innerText = "Password must be at least 4 characters long";
    return;
  }

  if (newPassword !== confirmNewPassword) {
    resetMsg.innerText = "Passwords do not match";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: resetEmployeeId,
        newPassword: newPassword
      })
    });

    const data = await response.json();

    if (response.ok) {
      resetMsg.innerText = "Password reset successful! You can now login with your new password.";
      resetMsg.className = "success";

      // Clear form
      document.getElementById("resetEmployeeId").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmNewPassword").value = "";

      // Close modal after 3 seconds
      setTimeout(() => {
        forgotPasswordModal.style.display = "none";
      }, 3000);
    } else {
      resetMsg.innerText = data.error || "Password reset failed";
    }
  } catch (error) {
    console.error('Password reset error:', error);
    resetMsg.innerText = "Connection error. Please try again.";
  }
});

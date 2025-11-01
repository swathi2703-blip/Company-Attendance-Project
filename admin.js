// API Base URL (use relative path so same-origin requests work)
const API_BASE = '/api';

// Get token and user info
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Check if user is logged in as admin
if (!token || user.role !== 'admin') {
  window.location.href = 'index.html';
}

// DOM Elements
const welcomeMessage = document.getElementById('welcomeMessage');
const dateElement = document.getElementById('date');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.querySelector('.sidebar');
const logoutBtn = document.getElementById('logoutBtn');

// Section elements
const dashboardSection = document.getElementById('dashboardSection');
const leaveRequestsSection = document.getElementById('leaveRequestsSection');
const checkedInSection = document.getElementById('checkedInSection');
const allEmployeesSection = document.getElementById('allEmployeesSection');

// Menu elements
const leaveRequestsMenu = document.getElementById('leaveRequestsMenu');
const checkedInMenu = document.getElementById('checkedInMenu');
const allEmployeesMenu = document.getElementById('allEmployeesMenu');

// Modal elements
const leaveModal = document.getElementById('leaveModal');
const closeLeaveModal = document.getElementById('closeLeaveModal');
const leaveDetails = document.getElementById('leaveDetails');
const approveBtn = document.getElementById('approveBtn');
const declineBtn = document.getElementById('declineBtn');

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, { ...defaultOptions, ...options });
  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
    return;
  }
  return response;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  welcomeMessage.innerText = `Welcome, ${user.name} 👋`;
  dateElement.innerText = new Date().toDateString();

  loadDashboardData();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Sidebar toggle
  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('show');
  });

  // Navigation
  leaveRequestsMenu.addEventListener('click', () => {
    showSection(leaveRequestsSection);
    loadLeaveRequests();
  });

  checkedInMenu.addEventListener('click', () => {
    showSection(checkedInSection);
    loadCheckedInEmployees();
  });

  allEmployeesMenu.addEventListener('click', () => {
    showSection(allEmployeesSection);
    loadAllEmployees();
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });

  // Modal
  closeLeaveModal.addEventListener('click', () => {
    leaveModal.style.display = 'none';
  });

  approveBtn.addEventListener('click', () => {
    updateLeaveStatus(currentLeaveId, 'approved');
  });

  declineBtn.addEventListener('click', () => {
    updateLeaveStatus(currentLeaveId, 'rejected');
  });
}

// Show section
function showSection(section) {
  // hide all sections
  [dashboardSection, leaveRequestsSection, checkedInSection, allEmployeesSection].forEach(s => {
    if (s) s.style.display = 'none';
  });

  // show requested section element
  if (section) section.style.display = 'block';

  // update active menu item styling
  document.querySelectorAll('.sidebar ul li').forEach(li => li.classList.remove('active'));
  // try to find matching menu item by id
  if (section === dashboardSection) document.querySelector('.sidebar ul li')?.classList.add('active');
  if (section === leaveRequestsSection) leaveRequestsMenu.classList.add('active');
  if (section === checkedInSection) checkedInMenu.classList.add('active');
  if (section === allEmployeesSection) allEmployeesMenu.classList.add('active');
}

// Load dashboard data
async function loadDashboardData() {
  try {
    // Load summary stats
    const [usersResponse, attendanceResponse, leavesResponse] = await Promise.all([
      apiCall('/users'),
      apiCall('/attendance'),
      apiCall('/leaves')
    ]);

    if (usersResponse.ok) {
      const users = await usersResponse.json();
      document.getElementById('totalEmployees').innerText = users.length;
    }

    if (attendanceResponse.ok) {
      const attendance = await attendanceResponse.json();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAttendance = attendance.filter(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime() && record.checkIn && !record.checkOut;
      });
      // update the metric IDs used in the HTML
      const checkedInEl = document.getElementById('checkedInCount') || document.getElementById('checkedInToday');
      if (checkedInEl) checkedInEl.innerText = todayAttendance.length;
      const todayAttendanceEl = document.getElementById('todayAttendance');
      if (todayAttendanceEl) todayAttendanceEl.innerText = `${todayAttendance.length}`;
    }

    if (leavesResponse.ok) {
      const leaves = await leavesResponse.json();
      const pendingLeaves = leaves.filter(leave => leave.status === 'pending');
      document.getElementById('pendingLeaves').innerText = pendingLeaves.length;
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

// Load leave requests
async function loadLeaveRequests() {
  try {
    const response = await apiCall('/leaves');
    if (response.ok) {
      const leaves = await response.json();
      displayLeaveRequests(leaves);
    }
  } catch (error) {
    console.error('Error loading leave requests:', error);
  }
}

// Display leave requests
function displayLeaveRequests(leaves) {
  const leaveRequestsList = document.getElementById('leaveRequestsList');
  leaveRequestsList.innerHTML = '';

  leaves.forEach(leave => {
    const li = document.createElement('li');
    li.className = 'leave-item';
    li.innerHTML = `
      <div class="leave-info">
        <strong>${leave.employeeId}</strong>
        <span>${leave.leaveType} Leave</span>
        <span>${new Date(leave.startDate).toDateString()} - ${new Date(leave.endDate).toDateString()}</span>
        <p>${leave.reason}</p>
      </div>
      <div class="leave-actions">
        <span class="status ${leave.status}">${leave.status}</span>
        ${leave.status === 'pending' ? `
          <button class="view-btn" onclick="viewLeaveDetails('${leave._id}')">View</button>
        ` : ''}
      </div>
    `;
    leaveRequestsList.appendChild(li);
  });
}

// View leave details
let currentLeaveId = null;
async function viewLeaveDetails(leaveId) {
  try {
    // Get leave details (we already have them from the list, but could fetch individually if needed)
    const response = await apiCall('/leaves');
    if (response.ok) {
      const leaves = await response.json();
      const leave = leaves.find(l => l._id === leaveId);

      if (leave) {
        currentLeaveId = leaveId;
        leaveDetails.innerHTML = `
          <h3>Leave Request Details</h3>
          <p><strong>Employee ID:</strong> ${leave.employeeId}</p>
          <p><strong>Leave Type:</strong> ${leave.leaveType}</p>
          <p><strong>Duration:</strong> ${new Date(leave.startDate).toDateString()} to ${new Date(leave.endDate).toDateString()}</p>
          <p><strong>Days:</strong> ${leave.totalDays}</p>
          <p><strong>Reason:</strong> ${leave.reason}</p>
          <p><strong>Status:</strong> ${leave.status}</p>
        `;
        leaveModal.style.display = 'flex';
      }
    }
  } catch (error) {
    console.error('Error viewing leave details:', error);
  }
}

// Update leave status
async function updateLeaveStatus(leaveId, status) {
  try {
    const response = await apiCall(`/leaves/${leaveId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      leaveModal.style.display = 'none';
      loadLeaveRequests();
      loadDashboardData();
      alert(`Leave request ${status} successfully!`);
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to update leave status');
    }
  } catch (error) {
    console.error('Error updating leave status:', error);
    alert('Connection error. Please try again.');
  }
}

// Load checked-in employees
async function loadCheckedInEmployees() {
  try {
    const response = await apiCall('/attendance');
    if (response.ok) {
      const attendance = await response.json();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkedInToday = attendance.filter(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime() && record.checkIn && !record.checkOut;
      });

      displayCheckedInEmployees(checkedInToday);
    }
  } catch (error) {
    console.error('Error loading checked-in employees:', error);
  }
}

// Display checked-in employees
function displayCheckedInEmployees(employees) {
  const checkedInList = document.getElementById('checkedInList');
  checkedInList.innerHTML = '';

  employees.forEach(record => {
    const li = document.createElement('li');
    li.className = 'employee-item';
    const checkInTime = new Date(record.checkIn).toLocaleTimeString();
    li.innerHTML = `
      <div class="employee-info">
        <strong>${record.employeeId}</strong>
        <span>Checked in at ${checkInTime}</span>
      </div>
    `;
    checkedInList.appendChild(li);
  });
}

// Load all employees
async function loadAllEmployees() {
  try {
    // fetch both users and today's attendance so we can mark checked-in employees
    const [usersResponse, attendanceResponse] = await Promise.all([
      apiCall('/users'),
      apiCall('/attendance')
    ]);

    if (usersResponse.ok) {
      const users = await usersResponse.json();
      const attendance = attendanceResponse && attendanceResponse.ok ? await attendanceResponse.json() : [];
      displayAllEmployees(users, attendance);
    }
  } catch (error) {
    console.error('Error loading employees:', error);
  }
}

// Display all employees
function displayAllEmployees(users, attendance = []) {
  // element in admin.html
  const employeesList = document.getElementById('allEmployeesList') || document.getElementById('allEmployeesList');
  employeesList.innerHTML = '';

  // compute today's checked-in employees from attendance (checkIn present and no checkOut)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkedMap = new Map(); // employeeId -> attendance record
  attendance.forEach(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    if (recordDate.getTime() === today.getTime() && record.checkIn && !record.checkOut) {
      checkedMap.set(record.employeeId, record);
    }
  });

  // Create a top block for checked-in employees, if any
  const checkedInArray = users.filter(u => checkedMap.has(u.employeeId));
  if (checkedInArray.length > 0) {
    const header = document.createElement('h3');
    header.innerText = 'Checked-in Now';
    header.className = 'checked-top-header';
    employeesList.appendChild(header);

    checkedInArray.forEach(user => {
      const record = checkedMap.get(user.employeeId);
      const li = document.createElement('div');
      li.className = 'employee-item checked-in';
      const checkInTime = record && record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '';
      li.innerHTML = `
        <div class="employee-info">
          <strong>${user.name}</strong>
          <span>${user.employeeId} - ${user.department || ''}</span>
          <span>${user.position || ''}</span>
        </div>
        <div class="employee-status">
          <span class="status in">Checked in at ${checkInTime}</span>
        </div>
      `;
      employeesList.appendChild(li);
    });

    // separator
    const sep = document.createElement('hr');
    sep.className = 'checked-sep';
    employeesList.appendChild(sep);
  }

  // remaining employees (not currently checked-in)
  const remaining = users.filter(u => !checkedMap.has(u.employeeId));
  if (remaining.length > 0) {
    const headerAll = document.createElement('h3');
    headerAll.innerText = 'All Employees';
    headerAll.className = 'all-header';
    employeesList.appendChild(headerAll);

    remaining.forEach(user => {
      const li = document.createElement('div');
      li.className = 'employee-item';
      li.innerHTML = `
        <div class="employee-info">
          <strong>${user.name}</strong>
          <span>${user.employeeId} - ${user.department || ''}</span>
          <span>${user.position || ''}</span>
        </div>
        <div class="employee-status">
          <span class="status ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span>
        </div>
      `;
      employeesList.appendChild(li);
    });
  }
}
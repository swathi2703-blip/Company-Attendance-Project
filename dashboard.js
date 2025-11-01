// API Base URL (use relative path so same-origin requests work)
const API_BASE = '/api';

// Get token and user info
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Check if user is logged in as employee
if (!token || user.role !== 'employee') {
  window.location.href = 'index.html';
}

// Display employee info
document.getElementById('welcomeMessage').innerText = `Welcome, ${user.name} 👋`;

// Display current date
document.getElementById('date').innerText = new Date().toDateString();

// Elements
const checkInBtn = document.getElementById('checkInBtn');
const checkOutBtn = document.getElementById('checkOutBtn');
const status = document.getElementById('status');
const locationElement = document.getElementById('location');
const historyList = document.getElementById('historyList');
const progress = document.querySelector('.progress-circle');
const percentText = document.getElementById('attendancePercent');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const logoutBtn = document.getElementById('logoutBtn');

// Leave Elements
const leaveModal = document.getElementById('leaveModal');
const leaveMenu = document.getElementById('leaveMenu');
const closeLeave = document.getElementById('closeLeave');
const leaveForm = document.getElementById('leaveForm');
const leaveHistoryList = document.getElementById('leaveHistoryList');

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

// Logout
logoutBtn.onclick = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};

// Sidebar toggle
menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('show');
});

// Load initial data
async function loadDashboard() {
  try {
    // Load attendance data
    const attendanceResponse = await apiCall('/attendance');
    if (attendanceResponse.ok) {
      const attendanceData = await attendanceResponse.json();
      displayAttendanceHistory(attendanceData);
      updateAttendanceStatus(attendanceData);
    }

    // Load leave data
    const leaveResponse = await apiCall('/leaves');
    if (leaveResponse.ok) {
      const leaveData = await leaveResponse.json();
      displayLeaveHistory(leaveData);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Check In
checkInBtn.onclick = async () => {
  try {
    const response = await apiCall('/attendance/checkin', { method: 'POST' });
    const data = await response.json();

    if (response.ok) {
      status.innerText = 'Status: Checked In ✅';
      status.style.color = '#4ECCA3';
      status.classList.add('checked-in');
      addHistory(`Checked In at ${new Date().toLocaleTimeString()}`);
      loadDashboard(); // Refresh data
    } else {
      alert(data.error || 'Check-in failed');
    }
  } catch (error) {
    console.error('Check-in error:', error);
    alert('Connection error. Please try again.');
  }
};

// Check Out
checkOutBtn.onclick = async () => {
  try {
    const response = await apiCall('/attendance/checkout', { method: 'POST' });
    const data = await response.json();

    if (response.ok) {
      status.innerText = 'Status: Checked Out ⏹️';
      status.style.color = '#ff5757';
      status.classList.remove('checked-in');
      addHistory(`Checked Out at ${new Date().toLocaleTimeString()}`);
      loadDashboard(); // Refresh data
    } else {
      alert(data.error || 'Check-out failed');
    }
  } catch (error) {
    console.error('Check-out error:', error);
    alert('Connection error. Please try again.');
  }
};

// Add History to UI
function addHistory(entry) {
  const li = document.createElement('li');
  li.textContent = `${new Date().toDateString()}: ${entry}`;
  historyList.prepend(li);
}

// Display attendance history
function displayAttendanceHistory(attendanceData) {
  historyList.innerHTML = '';
  attendanceData.slice(0, 10).forEach(record => {
    const li = document.createElement('li');
    const checkInTime = record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A';
    const checkOutTime = record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A';
    const totalHours = record.totalHours ? `${record.totalHours.toFixed(1)}h` : '';

    li.textContent = `${new Date(record.date).toDateString()}: Check-in ${checkInTime}, Check-out ${checkOutTime} ${totalHours}`;
    historyList.appendChild(li);
  });
}

// Update attendance status
function updateAttendanceStatus(attendanceData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecord = attendanceData.find(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  });

  if (todayRecord) {
    if (todayRecord.checkOut) {
      status.innerText = 'Status: Checked Out ⏹️';
      status.style.color = '#ff5757';
      status.classList.remove('checked-in');
    } else {
      status.innerText = 'Status: Checked In ✅';
      status.style.color = '#4ECCA3';
      status.classList.add('checked-in');
    }
  } else {
    status.innerText = 'Status: Not Checked In';
    status.style.color = '#6c757d';
    status.classList.remove('checked-in');
  }
}

// Display leave history
function displayLeaveHistory(leaveData) {
  leaveHistoryList.innerHTML = '';
  leaveData.forEach(leave => {
    const li = document.createElement('li');
    const startDate = new Date(leave.startDate).toDateString();
    const endDate = new Date(leave.endDate).toDateString();
    const statusClass = leave.status === 'approved' ? 'approved' : leave.status === 'rejected' ? 'rejected' : 'pending';

    li.innerHTML = `
      <div class="leave-item">
        <div class="leave-info">
          <strong>${leave.leaveType} Leave</strong>
          <span>${startDate} to ${endDate} (${leave.totalDays} days)</span>
          <p>${leave.reason}</p>
        </div>
        <span class="leave-status ${statusClass}">${leave.status}</span>
      </div>
    `;
    leaveHistoryList.appendChild(li);
  });
}

// Get Location
function fetchLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        locationElement.innerText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      },
      () => {
        locationElement.innerText = 'Location access denied';
      }
    );
  } else {
    locationElement.innerText = 'Geolocation not supported';
  }
}
fetchLocation();

// Attendance animation
function animateAttendance(targetPercent) {
  let percent = 0;
  const interval = setInterval(() => {
    percent++;
    percentText.innerText = percent + "%";
    progress.style.background = `conic-gradient(#4ECCA3 ${percent*3.6}deg, rgba(255,255,255,0.1) ${percent*3.6}deg)`;
    if(percent>=targetPercent) clearInterval(interval);
  },30);
}
animateAttendance(82);

// Leave Modal Open
leaveMenu.onclick = () => { leaveModal.style.display = 'flex'; };
closeLeave.onclick = () => { leaveModal.style.display = 'none'; };

// Leave Form Submit
leaveForm.onsubmit = async (e) => {
  e.preventDefault();
  const type = document.getElementById('leaveType').value;
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  const reason = document.getElementById('reason').value;

  try {
    const response = await apiCall('/leaves', {
      method: 'POST',
      body: JSON.stringify({
        leaveType: type,
        startDate: start,
        endDate: end,
        reason: reason
      })
    });

    const data = await response.json();

    if (response.ok) {
      leaveForm.reset();
      leaveModal.style.display = 'none';
      loadDashboard(); // Refresh leave history
      alert('Leave request submitted successfully!');
    } else {
      alert(data.error || 'Failed to submit leave request');
    }
  } catch (error) {
    console.error('Leave submission error:', error);
    alert('Connection error. Please try again.');
  }
};

// Initialize dashboard
loadDashboard();
fetchLocation();

// Attendance animation
function animateAttendance(targetPercent) {
  let percent = 0;
  const interval = setInterval(() => {
    percent++;
    percentText.innerText = percent + '%';
    progress.style.background = `conic-gradient(#4ECCA3 ${percent*3.6}deg, rgba(255,255,255,0.1) ${percent*3.6}deg)`;
    if(percent>=targetPercent) clearInterval(interval);
  },30);
}
animateAttendance(82);

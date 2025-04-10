// File: admin.js - Fully Updated Version with Search, CSV Export, Stats

const supabaseUrl = 'https://pleyywewugbjnimeutig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZXl5d2V3dWJ...';
const _supabase = window.supabase;
const supabase = _supabase.createClient(supabaseUrl, supabaseKey);

// DOM elements
const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const officeForm = document.getElementById('officeForm');
const officeTableBody = document.getElementById('officeTableBody');
const loadingIndicator = document.getElementById('loadingIndicator');
const loadError = document.getElementById('loadError');
const formSuccess = document.getElementById('formSuccess');
const formError = document.getElementById('formError');
const cancelEditBtn = document.getElementById('cancelEdit');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const statsDisplay = document.getElementById('statsDisplay');

// Check if user is already authenticated
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showAdminPanel();
    loadOffices();
  } else {
    showLoginPanel();
  }
});

// Login handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      loginError.textContent = error.message;
      loginError.classList.remove('hidden');
    } else {
      showAdminPanel();
      loadOffices();
    }
  } catch {
    loginError.textContent = 'Login failed. Please try again.';
    loginError.classList.remove('hidden');
  }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  showLoginPanel();
});

function showLoginPanel() {
  loginContainer.classList.remove('hidden');
  adminContainer.classList.add('hidden');
}

function showAdminPanel() {
  loginContainer.classList.add('hidden');
  adminContainer.classList.remove('hidden');
}

async function loadOffices() {
  loadingIndicator.classList.remove('hidden');
  loadError.classList.add('hidden');
  officeTableBody.innerHTML = '';

  try {
    const { data, error } = await supabase
      .from('government_offices')
      .select('*')
      .order('service_type', { ascending: true })
      .order('city', { ascending: true });

    if (error) throw error;

    if (data) {
      allOffices = data;
      filteredOffices = [...data];
      renderOffices(filteredOffices);
      updateStats(filteredOffices);
    }
  } catch (err) {
    loadError.textContent = 'Failed to load offices: ' + err.message;
    loadError.classList.remove('hidden');
  } finally {
    loadingIndicator.classList.add('hidden');
  }
}

let allOffices = [];
let filteredOffices = [];

function renderOffices(offices) {
  officeTableBody.innerHTML = '';
  offices.forEach(office => appendOfficeRow(office));
}

function appendOfficeRow(office) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${office.service_type}</td>
    <td>${office.city}</td>
    <td>${office.office_name}</td>
    <td>${office.address}</td>
    <td>
      <button class="btn btn-sm btn-primary edit-btn" data-id="${office.id}">Edit</button>
      <button class="btn btn-sm btn-danger delete-btn" data-id="${office.id}">Delete</button>
    </td>
  `;
  row.querySelector('.edit-btn').addEventListener('click', () => editOffice(office));
  row.querySelector('.delete-btn').addEventListener('click', () => deleteOffice(office.id));
  officeTableBody.appendChild(row);
}

function editOffice(office) {
  document.getElementById('officeId').value = office.id;
  document.getElementById('serviceType').value = office.service_type;
  document.getElementById('city').value = office.city;
  document.getElementById('officeName').value = office.office_name;
  document.getElementById('address').value = office.address;
  document.getElementById('timings').value = office.timings;
  document.getElementById('contactNumber').value = office.contact_number || '';
  document.getElementById('website').value = office.website || '';
  document.getElementById('mapLink').value = office.map_link || '';
  cancelEditBtn.classList.remove('hidden');
  document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

async function deleteOffice(id) {
  if (!confirm('Are you sure you want to delete this office?')) return;

  try {
    const { error } = await supabase.from('government_offices').delete().eq('id', id);
    if (error) throw error;
    formSuccess.textContent = 'Office deleted successfully.';
    formSuccess.classList.remove('hidden');
    setTimeout(() => formSuccess.classList.add('hidden'), 3000);
    loadOffices();
  } catch (err) {
    formError.textContent = 'Failed to delete office: ' + err.message;
    formError.classList.remove('hidden');
    setTimeout(() => formError.classList.add('hidden'), 5000);
  }
}

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
  officeForm.reset();
  document.getElementById('officeId').value = '';
  cancelEditBtn.classList.add('hidden');
}

officeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formSuccess.classList.add('hidden');
  formError.classList.add('hidden');

  const officeId = document.getElementById('officeId').value;
  const officeData = {
    service_type: document.getElementById('serviceType').value.toLowerCase(),
    city: document.getElementById('city').value.toLowerCase(),
    office_name: document.getElementById('officeName').value,
    address: document.getElementById('address').value,
    timings: document.getElementById('timings').value,
    contact_number: document.getElementById('contactNumber').value,
    website: document.getElementById('website').value,
    map_link: document.getElementById('mapLink').value
  };

  try {
    let result;
    if (officeId) {
      result = await supabase.from('government_offices').update(officeData).eq('id', officeId);
    } else {
      result = await supabase.from('government_offices').insert(officeData);
    }
    if (result.error) throw result.error;

    formSuccess.textContent = officeId ? 'Office updated successfully.' : 'Office added successfully.';
    formSuccess.classList.remove('hidden');
    setTimeout(() => formSuccess.classList.add('hidden'), 3000);
    resetForm();
    loadOffices();
  } catch (err) {
    formError.textContent = 'Failed to save office: ' + err.message;
    formError.classList.remove('hidden');
  }
});

// Search functionality
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  filteredOffices = allOffices.filter(office =>
    office.service_type.toLowerCase().includes(query) ||
    office.city.toLowerCase().includes(query) ||
    office.office_name.toLowerCase().includes(query)
  );
  renderOffices(filteredOffices);
  updateStats(filteredOffices);
});

// CSV Export
exportBtn.addEventListener('click', () => {
  let csv = "Service Type,City,Office Name,Address,Timings,Contact Number,Website,Map Link\n";
  filteredOffices.forEach(o => {
    csv += `"${o.service_type}","${o.city}","${o.office_name}","${o.address}","${o.timings}","${o.contact_number}","${o.website}","${o.map_link}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "government_offices.csv";
  link.click();
});

// Stats updater
function updateStats(offices) {
  const serviceCounts = {};
  offices.forEach(o => {
    serviceCounts[o.service_type] = (serviceCounts[o.service_type] || 0) + 1;
  });

  let html = `<strong>Total: ${offices.length}</strong><br>`;
  Object.entries(serviceCounts).forEach(([type, count]) => {
    html += `${type}: ${count}<br>`;
  });
  statsDisplay.innerHTML = html;
}

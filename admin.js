// Supabase config
const supabaseUrl = 'https://pleyywewugbjnimeutig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZXl5d2V3dWdiam5pbWV1dGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMTU3NTUsImV4cCI6MjA1OTU5MTc1NX0.wK2gPCgYsRC6tQoVBK98CQZmk-HOR5oIstLoIQCkU4U';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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

// Check session
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showAdminPanel();
    loadOffices();
  } else {
    showLoginPanel();
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('d-none');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = error.message;
    loginError.classList.remove('d-none');
  } else {
    showAdminPanel();
    loadOffices();
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  showLoginPanel();
});

// Show/Hide panels
function showLoginPanel() {
  loginContainer.classList.remove('d-none');
  adminContainer.classList.add('d-none');
}

function showAdminPanel() {
  loginContainer.classList.add('d-none');
  adminContainer.classList.remove('d-none');
}

// Load data
async function loadOffices() {
  loadingIndicator.classList.remove('d-none');
  officeTableBody.innerHTML = '';
  loadError.classList.add('d-none');

  const { data, error } = await supabase
    .from('government_offices')
    .select('*')
    .order('service_type', { ascending: true })
    .order('city', { ascending: true });

  loadingIndicator.classList.add('d-none');

  if (error) {
    loadError.textContent = 'Failed to load offices: ' + error.message;
    loadError.classList.remove('d-none');
    return;
  }

  data.forEach(appendOfficeRow);
}

// Append row
function appendOfficeRow(office) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${office.service_type}</td>
    <td>${office.city}</td>
    <td>${office.office_name}</td>
    <td>${office.address}</td>
    <td>
      <button class="btn btn-sm btn-primary me-1 edit-btn" data-id="${office.id}">Edit</button>
      <button class="btn btn-sm btn-danger delete-btn" data-id="${office.id}">Delete</button>
    </td>
  `;

  row.querySelector('.edit-btn').addEventListener('click', () => editOffice(office));
  row.querySelector('.delete-btn').addEventListener('click', () => deleteOffice(office.id));

  officeTableBody.appendChild(row);
}

// Edit
function editOffice(office) {
  document.getElementById('officeId').value = office.id;
  document.getElementById('serviceType').value = office.service_type;
  document.getElementById('city').value = office.city;
  document.getElementById('officeName').value = office.office_name;
  document.getElementById('address').value = office.address;
  document.getElementById('timings').value = office.timings || '';
  document.getElementById('contactNumber').value = office.contact_number || '';
  document.getElementById('website').value = office.website || '';
  document.getElementById('mapLink').value = office.map_link || '';
  cancelEditBtn.classList.remove('d-none');
}

// Cancel edit
cancelEditBtn.addEventListener('click', () => {
  officeForm.reset();
  document.getElementById('officeId').value = '';
  cancelEditBtn.classList.add('d-none');
});

// Delete
async function deleteOffice(id) {
  if (!confirm('Are you sure you want to delete this office?')) return;

  const { error } = await supabase.from('government_offices').delete().eq('id', id);

  if (error) {
    formError.textContent = error.message;
    formError.classList.remove('d-none');
    return;
  }

  formSuccess.textContent = 'Deleted successfully!';
  formSuccess.classList.remove('d-none');
  loadOffices();
  setTimeout(() => formSuccess.classList.add('d-none'), 2000);
}

// Save
officeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

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

  let result;
  if (officeId) {
    result = await supabase.from('government_offices').update(officeData).eq('id', officeId);
  } else {
    result = await supabase.from('government_offices').insert(officeData);
  }

  if (result.error) {
    formError.textContent = result.error.message;
    formError.classList.remove('d-none');
    return;
  }

  officeForm.reset();
  document.getElementById('officeId').value = '';
  cancelEditBtn.classList.add('d-none');
  formSuccess.textContent = officeId ? 'Updated successfully!' : 'Added successfully!';
  formSuccess.classList.remove('d-none');
  loadOffices();
  setTimeout(() => formSuccess.classList.add('d-none'), 2000);
});

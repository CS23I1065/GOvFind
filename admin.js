// File: admin.js
// Initialize Supabase client
const supabaseUrl = 'https://pleyywewugbjnimeutig.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZXl5d2V3dWdiam5pbWV1dGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMTU3NTUsImV4cCI6MjA1OTU5MTc1NX0.wK2gPCgYsRC6tQoVBK98CQZmk-HOR5oIstLoIQCkU4U'; // Replace with your Supabase anon/public key
const supabaseClient = Supabase.createClient(supabaseUrl, supabaseKey);

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

// Check if user is already authenticated
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
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
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            loginError.textContent = error.message;
            loginError.classList.remove('hidden');
        } else {
            showAdminPanel();
            loadOffices();
        }
    } catch (err) {
        loginError.textContent = 'Login failed. Please try again.';
        loginError.classList.remove('hidden');
    }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    showLoginPanel();
});

// Show login panel
function showLoginPanel() {
    loginContainer.classList.remove('hidden');
    adminContainer.classList.add('hidden');
}

// Show admin panel
function showAdminPanel() {
    loginContainer.classList.add('hidden');
    adminContainer.classList.remove('hidden');
}

// Load offices from database
async function loadOffices() {
    loadingIndicator.classList.remove('hidden');
    loadError.classList.add('hidden');
    officeTableBody.innerHTML = '';
    
    try {
        const { data, error } = await supabaseClient
            .from('government_offices')
            .select('*')
            .order('service_type', { ascending: true })
            .order('city', { ascending: true });
        
        if (error) throw error;
        
        data.forEach(office => appendOfficeRow(office));
    } catch (err) {
        loadError.textContent = 'Failed to load offices: ' + err.message;
        loadError.classList.remove('hidden');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// Add office row to table
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

// Edit office
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

// Delete office
async function deleteOffice(id) {
    if (!confirm('Are you sure you want to delete this office?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('government_offices')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        loadOffices();
        formSuccess.textContent = 'Office deleted successfully.';
        formSuccess.classList.remove('hidden');
        setTimeout(() => formSuccess.classList.add('hidden'), 3000);
    } catch (err) {
        formError.textContent = 'Failed to delete office: ' + err.message;
        formError.classList.remove('hidden');
        setTimeout(() => formError.classList.add('hidden'), 5000);
    }
}

// Cancel edit
cancelEditBtn.addEventListener('click', () => {
    resetForm();
});

// Reset form
function resetForm() {
    officeForm.reset();
    document.getElementById('officeId').value = '';
    cancelEditBtn.classList.add('hidden');
}

// Office form submission
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
            result = await supabaseClient
                .from('government_offices')
                .update(officeData)
                .eq('id', officeId);
        } else {
            result = await supabaseClient
                .from('government_offices')
                .insert(officeData);
        }
        
        if (result.error) throw result.error;
        
        resetForm();
        loadOffices();
        
        formSuccess.textContent = officeId ? 'Office updated successfully.' : 'Office added successfully.';
        formSuccess.classList.remove('hidden');
        setTimeout(() => formSuccess.classList.add('hidden'), 3000);
    } catch (err) {
        formError.textContent = 'Failed to save office: ' + err.message;
        formError.classList.remove('hidden');
    }
});

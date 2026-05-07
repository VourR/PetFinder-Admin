import { useState, useEffect } from 'react';
import InstallPWA from './components/InstallPWA';

const API_BASE_URL = "https://paw-find-api.vercel.app";
function App() {
  const [activeTab, setActiveTab] = useState('pets');
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [pets, setPets] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Admin auth & requests
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || null);
  const [adminIdentity, setAdminIdentity] = useState(() => localStorage.getItem('adminIdentity') || '');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [adoptedPets, setAdoptedPets] = useState([]);
  const [loadingAdoptedPets, setLoadingAdoptedPets] = useState(false);
  const [requestsView, setRequestsView] = useState('pending'); // 'pending' or 'adopted'
  const [requestNotes, setRequestNotes] = useState({});

  const [petForm, setPetForm] = useState({
    name: '',
    type: 'cat',
    age: '',
    description: '',
    shelter_id: '',
    image: null
  });

  const [shelterForm, setShelterForm] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    image: null
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getReviewedByLabel = (request) => {
    return (
      request.reviewed_by ||
      request.reviewedBy ||
      request.reviewed_by_name ||
      request.reviewed_by_email ||
      request.reviewer_name ||
      request.reviewer_email ||
      adminIdentity ||
      'Admin'
    );
  };

  const resetForms = () => {
    setPetForm({
      name: '',
      type: 'cat',
      age: '',
      description: '',
      shelter_id: '',
      image: null
    });
    setShelterForm({
      name: '',
      city: '',
      address: '',
      phone: '',
      image: null
    });
    setEditMode(false);
    setEditId(null);
  };

  // Fetch data
  const fetchPets = async () => {
    setLoadingData(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pets`);
      if (!response.ok) throw new Error('Failed to fetch pets');
      const result = await response.json();
      setPets(result.data || []);
    } catch (error) {
      showMessage('error', `Gagal memuat pets: ${error.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchShelters = async () => {
    setLoadingData(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/shelters`);
      if (!response.ok) throw new Error('Failed to fetch shelters');
      const result = await response.json();
      setShelters(result.data || []);
    } catch (error) {
      showMessage('error', `Gagal memuat shelters: ${error.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pets') {
      fetchPets();
      fetchShelters();
    } else if (activeTab === 'shelters') {
      fetchShelters();
    } else if (activeTab === 'requests') {
      fetchRequests();
      fetchAdoptedPets();
    }
    setView('list');
    resetForms();
  }, [activeTab, adminToken]);

  // persist admin tokenis
  useEffect(() => {
    if (adminToken) localStorage.setItem('adminToken', adminToken);
    else localStorage.removeItem('adminToken');
  }, [adminToken]);

  useEffect(() => {
    if (adminIdentity) localStorage.setItem('adminIdentity', adminIdentity);
    else localStorage.removeItem('adminIdentity');
  }, [adminIdentity]);

  const adminLogin = async () => {
    if (!adminEmail || !adminPassword) { showMessage('error', 'Email dan password wajib'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminEmail, password: adminPassword })
      });
      
      const data = await res.json();
      console.log('Login response:', data, 'Status:', res.status);
      
      if (!res.ok) {
        const errorMsg = data.message || data.error || data.msg || 'Login gagal';
        throw new Error(errorMsg);
      }
      
      // Try various token field names
      const token = data.token || data.accessToken || data.access_token || 
                   (data.data && (data.data.token || data.data.accessToken || data.data.access_token));
      
      if (!token) {
        console.error('Token not found in response:', data);
        throw new Error('Token tidak diterima dari server');
      }
      
      setAdminToken(token);
      setAdminIdentity(adminEmail);
      setAdminEmail(''); 
      setAdminPassword('');
      showMessage('success', 'Login berhasil');
      setActiveTab('requests');
    } catch (error) {
      console.error('Login error:', error);
      showMessage('error', `${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = () => {
    setAdminToken(null);
    setAdminIdentity('');
    setRequests([]);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminIdentity');
    showMessage('success', 'Logged out');
  };

  const fetchRequests = async () => {
    if (!adminToken) return;
    setLoadingRequests(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/adopted-pets/requests`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil requests');
      const data = await res.json();
      setRequests(data.data || data.requests || data || []);
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setLoadingRequests(false);
    }
  };

  const approveRequest = async (id, adminNotes = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/adopted-pets/requests/${id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_notes: adminNotes,
          notes: adminNotes,
          reviewed_by: adminIdentity,
          reviewed_by_email: adminIdentity
        })
      });
      if (!res.ok) throw new Error('Approve gagal');
      showMessage('success', 'Request disetujui');
      setRequestNotes((prev) => ({ ...prev, [id]: '' }));
      fetchRequests();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const rejectRequest = async (id, adminNotes = '') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/adopted-pets/requests/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_notes: adminNotes,
          notes: adminNotes,
          reviewed_by: adminIdentity,
          reviewed_by_email: adminIdentity
        })
      });
      if (!res.ok) throw new Error('Reject gagal');
      showMessage('success', 'Request ditolak');
      setRequestNotes((prev) => ({ ...prev, [id]: '' }));
      fetchRequests();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    }
  };

  const fetchAdoptedPets = async () => {
    if (!adminToken) return;
    setLoadingAdoptedPets(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/adopted-pets`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil adopted pets');
      const data = await res.json();
      setAdoptedPets(data.data || data || []);
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setLoadingAdoptedPets(false);
    }
  };

  // CREATE
  const handlePetCreate = async () => {
    if (!petForm.name || !petForm.shelter_id) {
      showMessage('error', 'Nama dan Shelter wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', petForm.name);
      formData.append('type', petForm.type);
      if (petForm.age) formData.append('age', petForm.age);
      if (petForm.description) formData.append('description', petForm.description);
      formData.append('shelter_id', petForm.shelter_id);
      if (petForm.image) formData.append('image', petForm.image);

      const response = await fetch(`${API_BASE_URL}/api/pets`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create pet');
      }

      const result = await response.json();
      const data = result.data || result;
      showMessage('success', `Pet "${data.name || petForm.name}" berhasil ditambahkan!`);
      resetForms();
      setView('list');
      fetchPets();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE Pet
  const handlePetUpdate = async () => {
    if (!petForm.name || !petForm.shelter_id) {
      showMessage('error', 'Nama dan Shelter wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', petForm.name);
      formData.append('type', petForm.type);
      if (petForm.age) formData.append('age', petForm.age);
      if (petForm.description) formData.append('description', petForm.description);
      formData.append('shelter_id', petForm.shelter_id);
      if (petForm.image) formData.append('image', petForm.image);

      const response = await fetch(`${API_BASE_URL}/api/pets/${editId}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update pet');
      }

      const data = await response.json();
      showMessage('success', `Pet "${data.name || petForm.name}" berhasil diupdate!`);
      resetForms();
      setView('list');
      fetchPets();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShelterCreate = async () => {
    if (!shelterForm.name || !shelterForm.city) {
      showMessage('error', 'Nama dan Kota wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', shelterForm.name);
      formData.append('city', shelterForm.city);
      if (shelterForm.address) formData.append('address', shelterForm.address);
      if (shelterForm.phone) formData.append('phone', shelterForm.phone);
      if (shelterForm.image) formData.append('image', shelterForm.image);

      const response = await fetch(`${API_BASE_URL}/api/shelters`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create shelter');
      }

      const data = await response.json();
      showMessage('success', `Shelter "${data.name || shelterForm.name}" berhasil ditambahkan!`);
      resetForms();
      setView('list');
      fetchShelters();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // UPDATE Shelter
  const handleShelterUpdate = async () => {
    if (!shelterForm.name || !shelterForm.city) {
      showMessage('error', 'Nama dan Kota wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', shelterForm.name);
      formData.append('city', shelterForm.city);
      if (shelterForm.address) formData.append('address', shelterForm.address);
      if (shelterForm.phone) formData.append('phone', shelterForm.phone);
      if (shelterForm.image) formData.append('image', shelterForm.image);

      const response = await fetch(`${API_BASE_URL}/api/shelters/${editId}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update shelter');
      }

      const data = await response.json();
      showMessage('success', `Shelter "${data.name || shelterForm.name}" berhasil diupdate!`);
      resetForms();
      setView('list');
      fetchShelters();
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const handleDelete = async (type, id, name) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${type === 'pets' ? 'pet' : 'shelter'} "${name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/${type}/${id}`, {
        method: 'DELETE'
      });

      // Check if response is ok or if it returns 204 No Content
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete ${type}`);
      }

      showMessage('success', `${type === 'pets' ? 'Pet' : 'Shelter'} "${name}" berhasil dihapus!`);
      if (type === 'pets') {
        fetchPets();
      } else {
        fetchShelters();
      }
    } catch (error) {
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit button handler
  const handleEdit = (type, item) => {
    setEditMode(true);
    setEditId(item.id);
    setView('form');
    
    if (type === 'pets') {
      setPetForm({
        name: item.name,
        type: item.type,
        age: item.age || '',
        description: item.description || '',
        shelter_id: item.shelter_id,
        image: null
      });
    } else {
      setShelterForm({
        name: item.name,
        city: item.city,
        address: item.address || '',
        phone: item.phone || '',
        image: null
      });
    }
  };

  // Fullscreen login page jika belum login
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <InstallPWA />
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">PawFind Admin</h1>
          <p className="text-gray-600 text-center mb-8">Login untuk akses panel admin</p>
          
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={adminEmail} 
                onChange={(e) => setAdminEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && adminLogin()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                value={adminPassword} 
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && adminLogin()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button 
              onClick={adminLogin}
              disabled={loading}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <InstallPWA />
      
      {/* Mobile Header dengan Hamburger Menu */}
      <div className="lg:hidden bg-white shadow-lg sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">PawFind</h1>
            <p className="text-xs text-gray-600">Admin Panel</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={adminLogout}
              className="p-2 text-red-600 hover:text-red-800 font-semibold text-sm"
            >
              Logout
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white">
            <button
              onClick={() => { setActiveTab('pets'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 font-semibold transition-colors ${
                activeTab === 'pets'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🐾 Pets
            </button>
            <button
              onClick={() => { setActiveTab('shelters'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 font-semibold transition-colors ${
                activeTab === 'shelters'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🏠 Shelters
            </button>
            <button
              onClick={() => { setActiveTab('requests'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 font-semibold transition-colors ${
                activeTab === 'requests'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📨 Requests
            </button>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        {/* Desktop Header */}
        <div className="hidden lg:flex lg:justify-between lg:items-center bg-white rounded-lg shadow-lg p-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">PawFind Admin</h1>
            <p className="text-gray-600">Kelola data hewan peliharaan dan tempat penampungan</p>
          </div>
          <button
            onClick={adminLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Logout
          </button>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Desktop Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="hidden lg:flex border-b">
            <button
              onClick={() => setActiveTab('pets')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'pets'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🐾 Pets
            </button>
            <button
              onClick={() => setActiveTab('shelters')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'shelters'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🏠 Shelters
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'requests'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📨 Requests
            </button>
          </div>

          <div className="p-4 lg:p-8">
            {/* View Toggle */}
            <div className="mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4">
              {activeTab === 'requests' ? (
                <>
                  <button
                    onClick={() => { setRequestsView('pending'); setView('list'); resetForms(); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors ${
                      requestsView === 'pending'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📋 Daftar Requests
                  </button>
                  <button
                    onClick={() => { setRequestsView('adopted'); setView('list'); resetForms(); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors ${
                      requestsView === 'adopted'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ✓ Adopted Pets
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setView('list'); resetForms(); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors ${
                      view === 'list'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📋 Daftar {activeTab === 'pets' ? 'Pets' : 'Shelters'}
                  </button>
                  <button
                    onClick={() => { setView('form'); resetForms(); }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors ${
                      view === 'form'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ➕ Tambah {activeTab === 'pets' ? 'Pet' : 'Shelter'}
                  </button>
                </>
              )}
            </div>

            {/* LIST VIEW */}
            {view === 'list' && (
              <div>
                {activeTab === 'requests' ? (
                  <div>
                    {/* PENDING REQUESTS VIEW */}
                    {requestsView === 'pending' && (
                    <div>
                    {loadingRequests ? (
                      <div className="text-center py-12 text-gray-500">Memuat requests...</div>
                    ) : requests.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">Belum ada request adopsi.</div>
                    ) : (
                      <div className="space-y-6">
                        {requests.map((r) => (
                          <div key={r.id} className="border border-gray-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white">
                            {/* Status Badge */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 border-b">
                              <h3 className="font-bold text-lg text-gray-800">Request ID: {r.id?.substring(0, 8)}</h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                r.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                r.status === 'approved' ? 'bg-green-200 text-green-800' :
                                'bg-red-200 text-red-800'
                              }`}>
                                {r.status === 'pending' ? 'Menunggu' : r.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                              </span>
                            </div>
                            
                            {/* Main Content */}
                            <div className="p-4">
                              {/* Pet Info with Image */}
                              <div className="mb-4">
                                <h4 className="font-bold text-gray-600 text-sm mb-2 uppercase">🐾 Data Hewan</h4>
                                <div className="flex flex-col sm:flex-row gap-4">
                                  {r.pet_image_url && (
                                    <img 
                                      src={r.pet_image_url} 
                                      alt={r.pet_name}
                                      className="w-full sm:w-40 h-40 object-cover rounded-lg"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-xl font-bold text-gray-800">{r.pet_name}</p>
                                    <p className="text-gray-600"><span className="font-semibold">Jenis:</span> {r.pet_type}</p>
                                    {r.pet_age && <p className="text-gray-600"><span className="font-semibold">Umur:</span> {r.pet_age} tahun</p>}
                                    {r.pet_description && <p className="text-gray-600 mt-2"><span className="font-semibold">Deskripsi:</span> {r.pet_description}</p>}
                                  </div>
                                </div>
                              </div>

                              <hr className="my-4" />

                              {/* Adopter Info */}
                              <div className="mb-4">
                                <h4 className="font-bold text-gray-600 text-sm mb-2 uppercase">👤 Data Pemohon</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-gray-600"><span className="font-semibold">Nama:</span> {r.adopter?.full_name || r.adopter_name}</p>
                                    <p className="text-gray-600"><span className="font-semibold">Email:</span> {r.adopter?.email || r.adopter_email}</p>
                                    <p className="text-gray-600"><span className="font-semibold">Telepon:</span> {r.adopter?.phone || r.adopter_phone}</p>
                                  </div>
                                  {r.adopter?.message && (
                                    <div>
                                      <p className="text-gray-600"><span className="font-semibold">Pesan:</span></p>
                                      <p className="text-gray-700 italic border-l-2 border-indigo-400 pl-2">{r.adopter.message}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {r.status === 'pending' && (
                                <div className="mb-4">
                                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor={`admin-notes-${r.id}`}>
                                    Admin Notes
                                  </label>
                                  <textarea
                                    id={`admin-notes-${r.id}`}
                                    rows="3"
                                    value={requestNotes[r.id] || ''}
                                    onChange={(e) => setRequestNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                    placeholder="Tulis catatan untuk approval atau penolakan adopsi..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                  />
                                </div>
                              )}

                              {/* Review Info if exists */}
                              {r.reviewed_at && (
                                <>
                                  <hr className="my-4" />
                                  <div className="mb-4">
                                    <h4 className="font-bold text-gray-600 text-sm mb-2 uppercase">✓ Review Admin</h4>
                                    <p className="text-sm text-gray-600"><span className="font-semibold">Direvisi oleh:</span> {getReviewedByLabel(r)}</p>
                                    <p className="text-sm text-gray-600"><span className="font-semibold">Tanggal Review:</span> {new Date(r.reviewed_at).toLocaleString('id-ID')}</p>
                                    {r.admin_notes && <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Catatan:</span> {r.admin_notes}</p>}
                                  </div>
                                </>
                              )}

                              <hr className="my-4" />

                              {/* Timeline */}
                              <div className="mb-4">
                                <p className="text-xs text-gray-500">Diminta: {new Date(r.requested_at).toLocaleString('id-ID')}</p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {r.status === 'pending' && (
                              <div className="bg-gray-50 px-4 py-3 flex gap-3 border-t">
                                <button 
                                  onClick={() => approveRequest(r.id, requestNotes[r.id] || '')} 
                                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                                >
                                  ✓ Setujui
                                </button>
                                <button 
                                  onClick={() => rejectRequest(r.id, requestNotes[r.id] || '')} 
                                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                                >
                                  ✗ Tolak
                                </button>
                              </div>
                            )}
                            {r.status !== 'pending' && (
                              <div className="bg-gray-50 px-4 py-3 border-t text-center text-sm text-gray-600">
                                Request sudah di-{r.status === 'approved' ? 'setujui' : 'tolak'} oleh {getReviewedByLabel(r)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
                    )}

                    {/* ADOPTED PETS VIEW */}
                    {requestsView === 'adopted' && (
                    <div>
                    {loadingAdoptedPets ? (
                      <div className="text-center py-12 text-gray-500">Memuat adopted pets...</div>
                    ) : adoptedPets.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">Belum ada hewan yang diadopsi.</div>
                    ) : (
                      <div className="space-y-6">
                        {adoptedPets.map((pet) => (
                          <div key={pet.id} className="border border-green-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white">
                            {/* Header with adoption date */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-green-200">
                              <h3 className="font-bold text-lg text-gray-800">✓ {pet.pet_name}</h3>
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800">
                                Diadopsi
                              </span>
                            </div>
                            
                            {/* Main Content */}
                            <div className="p-4">
                              {/* Pet Info with Image */}
                              <div className="mb-4">
                                <h4 className="font-bold text-gray-600 text-sm mb-2 uppercase">🐾 Data Hewan</h4>
                                <div className="flex flex-col sm:flex-row gap-4">
                                  {pet.pet_image_url && (
                                    <img 
                                      src={pet.pet_image_url} 
                                      alt={pet.pet_name}
                                      className="w-full sm:w-40 h-40 object-cover rounded-lg"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-xl font-bold text-gray-800">{pet.pet_name}</p>
                                    <p className="text-gray-600"><span className="font-semibold">Jenis:</span> {pet.pet_type}</p>
                                    {pet.pet_age && <p className="text-gray-600"><span className="font-semibold">Umur:</span> {pet.pet_age} tahun</p>}
                                    {pet.pet_description && <p className="text-gray-600 mt-2"><span className="font-semibold">Deskripsi:</span> {pet.pet_description}</p>}
                                    {pet.shelter_name && <p className="text-gray-600 mt-2"><span className="font-semibold">Dari Shelter:</span> {pet.shelter_name}</p>}
                                  </div>
                                </div>
                              </div>

                              <hr className="my-4" />

                              {/* Adopter Info */}
                              <div className="mb-4">
                                <h4 className="font-bold text-gray-600 text-sm mb-2 uppercase">👤 Data Adopter</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    {pet.adopter_name ? (
                                      <>
                                        <p className="text-gray-600"><span className="font-semibold">Nama:</span> {pet.adopter_name}</p>
                                        {pet.adopter_email && <p className="text-gray-600"><span className="font-semibold">Email:</span> {pet.adopter_email}</p>}
                                        {pet.adopter_phone && <p className="text-gray-600"><span className="font-semibold">Telepon:</span> {pet.adopter_phone}</p>}
                                      </>
                                    ) : (
                                      <p className="text-gray-500 italic">Informasi adopter tidak tersedia</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <hr className="my-4" />

                              {/* Timeline */}
                              <div className="mb-4">
                                <p className="text-xs text-gray-500">Diadopsi: {new Date(pet.adoption_date || pet.created_at).toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {loadingData ? (
                      <div className="text-center py-12 text-gray-500">Memuat data...</div>
                    ) : activeTab === 'pets' ? (
                      <div className="space-y-4">
                        {pets.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">Belum ada data pets. Tambahkan pet pertama!</div>
                        ) : (
                          pets.map((pet) => (
                            <div key={pet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex flex-col sm:flex-row items-start gap-4">
                                {pet.image_url && (
                                  <img src={pet.image_url} alt={pet.name} className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg" />
                                )}
                                <div className="flex-1 w-full">
                                  <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
                                  <p className="text-gray-600">Jenis: {pet.type}</p>
                                  {pet.age && <p className="text-gray-600">Umur: {pet.age} tahun</p>}
                                  {pet.description && <p className="text-gray-600 mt-2 line-clamp-2">{pet.description}</p>}
                                  <p className="text-sm text-gray-500 mt-1">Shelter: {shelters.find(s => s.id === pet.shelter_id)?.name || 'Unknown'}</p>
                                </div>
                                <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                                  <button onClick={() => handleEdit('pets', pet)} className="flex-1 sm:flex-none px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm">✏️ Edit</button>
                                  <button onClick={() => handleDelete('pets', pet.id, pet.name)} className="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">🗑️ Hapus</button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {shelters.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">Belum ada data shelters. Tambahkan shelter pertama!</div>
                        ) : (
                          shelters.map((shelter) => (
                            <div key={shelter.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex flex-col sm:flex-row items-start gap-4">
                                {shelter.image_url && (
                                  <img src={shelter.image_url} alt={shelter.name} className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg" />
                                )}
                                <div className="flex-1 w-full">
                                  <h3 className="text-xl font-bold text-gray-800">{shelter.name}</h3>
                                  <p className="text-gray-600">📍 {shelter.city}</p>
                                  {shelter.address && <p className="text-gray-600 line-clamp-1">{shelter.address}</p>}
                                  {shelter.phone && <p className="text-gray-600">📞 {shelter.phone}</p>}
                                </div>
                                <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                                  <button onClick={() => handleEdit('shelters', shelter)} className="flex-1 sm:flex-none px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm">✏️ Edit</button>
                                  <button onClick={() => handleDelete('shelters', shelter.id, shelter.name)} className="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">🗑️ Hapus</button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FORM VIEW */}
            {view === 'form' && (
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-6">
                  {editMode ? '✏️ Edit' : '➕ Tambah'} {activeTab === 'pets' ? 'Pet' : 'Shelter'}
                </h2>

                {activeTab === 'pets' ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Pet <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={petForm.name}
                        onChange={(e) => setPetForm({...petForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Contoh: Fluffy"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipe <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={petForm.type}
                        onChange={(e) => setPetForm({...petForm, type: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="cat">Kucing</option>
                        <option value="dog">Anjing</option>
                        <option value="rabbit">Kelinci</option>
                        <option value="bird">Burung</option>
                        <option value="other">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Umur (tahun)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={petForm.age}
                        onChange={(e) => setPetForm({...petForm, age: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Contoh: 2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shelter <span className="text-red-500">*</span>
                      </label>
                      {shelters.length === 0 ? (
                        <div className="w-full px-4 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-yellow-700">
                          Belum ada shelter tersedia. Tambahkan shelter terlebih dahulu.
                        </div>
                      ) : (
                        <select
                          value={petForm.shelter_id}
                          onChange={(e) => setPetForm({...petForm, shelter_id: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Pilih Shelter</option>
                          {shelters.map((shelter) => (
                            <option key={shelter.id} value={shelter.id}>
                              {shelter.name} - {shelter.city}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deskripsi
                      </label>
                      <textarea
                        value={petForm.description}
                        onChange={(e) => setPetForm({...petForm, description: e.target.value})}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ceritakan tentang pet ini..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foto Pet {editMode && '(kosongkan jika tidak ingin mengubah)'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPetForm({...petForm, image: e.target.files[0]})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={editMode ? handlePetUpdate : handlePetCreate}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Menyimpan...' : editMode ? '💾 Update Pet' : '➕ Tambah Pet'}
                      </button>
                      <button
                        onClick={() => { setView('list'); resetForms(); }}
                        className="sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Shelter <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shelterForm.name}
                        onChange={(e) => setShelterForm({...shelterForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Contoh: Happy Pets Shelter"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kota <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shelterForm.city}
                        onChange={(e) => setShelterForm({...shelterForm, city: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Contoh: Jakarta"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alamat
                      </label>
                      <input
                        type="text"
                        value={shelterForm.address}
                        onChange={(e) => setShelterForm({...shelterForm, address: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Jl. Contoh No. 123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor Telepon
                      </label>
                      <input
                        type="tel"
                        value={shelterForm.phone}
                        onChange={(e) => setShelterForm({...shelterForm, phone: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="081234567890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foto Shelter {editMode && '(kosongkan jika tidak ingin mengubah)'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setShelterForm({...shelterForm, image: e.target.files[0]})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={editMode ? handleShelterUpdate : handleShelterCreate}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Menyimpan...' : editMode ? '💾 Update Shelter' : '➕ Tambah Shelter'}
                      </button>
                      <button
                        onClick={() => { setView('list'); resetForms(); }}
                        className="sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 mb-20 lg:mb-6 bg-white rounded-lg shadow-lg p-4">
          <p className="text-xs lg:text-sm text-gray-600 text-center break-all">
            API Base URL: <span className="font-mono text-indigo-600">{API_BASE_URL}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
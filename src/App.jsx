import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:4000';

function App() {
  const [activeTab, setActiveTab] = useState('pets');
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const [pets, setPets] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

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
    } else {
      fetchShelters();
    }
    setView('list');
    resetForms();
  }, [activeTab]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pet & Shelter Admin</h1>
          <p className="text-gray-600">Kelola data hewan peliharaan dan tempat penampungan</p>
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b">
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
          </div>

          <div className="p-8">
            {/* View Toggle */}
            <div className="mb-6 flex gap-4">
              <button
                onClick={() => { setView('list'); resetForms(); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📋 Daftar {activeTab === 'pets' ? 'Pets' : 'Shelters'}
              </button>
              <button
                onClick={() => { setView('form'); resetForms(); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'form'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ➕ Tambah {activeTab === 'pets' ? 'Pet' : 'Shelter'}
              </button>
            </div>

            {/* LIST VIEW */}
            {view === 'list' && (
              <div>
                {loadingData ? (
                  <div className="text-center py-12 text-gray-500">
                    Memuat data...
                  </div>
                ) : activeTab === 'pets' ? (
                  <div className="space-y-4">
                    {pets.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        Belum ada data pets. Tambahkan pet pertama!
                      </div>
                    ) : (
                      pets.map((pet) => (
                        <div key={pet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            {pet.image_url && (
                              <img 
                                src={pet.image_url} 
                                alt={pet.name}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
                              <p className="text-gray-600">Jenis: {pet.type}</p>
                              {pet.age && <p className="text-gray-600">Umur: {pet.age} tahun</p>}
                              {pet.description && <p className="text-gray-600 mt-2">{pet.description}</p>}
                              <p className="text-sm text-gray-500 mt-1">
                                Shelter: {shelters.find(s => s.id === pet.shelter_id)?.name || 'Unknown'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit('pets', pet)}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDelete('pets', pet.id, pet.name)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                🗑️ Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {shelters.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        Belum ada data shelters. Tambahkan shelter pertama!
                      </div>
                    ) : (
                      shelters.map((shelter) => (
                        <div key={shelter.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            {shelter.image_url && (
                              <img 
                                src={shelter.image_url} 
                                alt={shelter.name}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-800">{shelter.name}</h3>
                              <p className="text-gray-600">📍 {shelter.city}</p>
                              {shelter.address && <p className="text-gray-600">{shelter.address}</p>}
                              {shelter.phone && <p className="text-gray-600">📞 {shelter.phone}</p>}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit('shelters', shelter)}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDelete('shelters', shelter.id, shelter.name)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                🗑️ Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FORM VIEW */}
            {view === 'form' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
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

                    <div className="flex gap-4">
                      <button
                        onClick={editMode ? handlePetUpdate : handlePetCreate}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Menyimpan...' : editMode ? '💾 Update Pet' : '➕ Tambah Pet'}
                      </button>
                      <button
                        onClick={() => { setView('list'); resetForms(); }}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
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

                    <div className="flex gap-4">
                      <button
                        onClick={editMode ? handleShelterUpdate : handleShelterCreate}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Menyimpan...' : editMode ? '💾 Update Shelter' : '➕ Tambah Shelter'}
                      </button>
                      <button
                        onClick={() => { setView('list'); resetForms(); }}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
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
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <p className="text-sm text-gray-600 text-center">
            API Base URL: <span className="font-mono text-indigo-600">{API_BASE_URL}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
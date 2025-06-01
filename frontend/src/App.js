import React, { useState, useEffect, useContext, createContext } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API}/users/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      const { access_token, user: newUser } = response.data;
      
      setToken(access_token);
      setUser(newUser);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Enhanced Loading Component
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 border-blue-600`}></div>
    </div>
  );
};

// Enhanced Stats Card Component
const StatsCard = ({ title, value, icon, trend, trendValue, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${colorClasses[color]} text-white`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trend === 'up' ? (
                      <svg className="self-center flex-shrink-0 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="self-center flex-shrink-0 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="sr-only">{trend === 'up' ? 'Increased' : 'Decreased'} by</span>
                    {trendValue}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Quick Action Card
const QuickActionCard = ({ title, description, icon, onClick, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-gradient-to-r ${colorClasses[color]} p-6 rounded-xl text-white cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
    >
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm opacity-90">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Landing Page Component
const LandingPage = () => {
  const { login, register } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'patient',
    phone: '',
    specialization: '',
    license_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (showLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData);
      }

      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            {/* Logo Section */}
            <div className="flex items-center justify-center lg:justify-start pt-6 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-3 group">
                <div className="relative">
                  <img
                    className="h-12 w-12 transform group-hover:scale-110 transition-transform duration-300"
                    src="https://images.unsplash.com/photo-1580115465903-0e4a824a4e9a"
                    alt="MedAssist Logo"
                  />
                  <div className="absolute inset-0 bg-blue-400 opacity-20 rounded-full animate-pulse"></div>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MedAssist
                </h1>
              </div>
            </div>
            
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Healthcare at</span>
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent xl:inline"> your fingertips</span>
                </h1>
                <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Connect with doctors instantly, get home lab tests, enjoy drug delivery, and manage prescriptions from anywhere. 
                  MedAssist makes healthcare accessible, convenient, and secure.
                </p>
                <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="rounded-md shadow-lg">
                    <button
                      onClick={() => setShowLogin(false)}
                      className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      Get Started
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={() => setShowLogin(true)}
                      className="w-full flex items-center justify-center px-8 py-4 border-2 border-blue-600 text-base font-medium rounded-xl text-blue-700 bg-white hover:bg-blue-50 transform hover:scale-105 transition-all duration-300"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="relative h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full overflow-hidden rounded-l-3xl lg:rounded-l-none">
            <img
              className="h-full w-full object-cover transform hover:scale-105 transition-transform duration-700"
              src="https://images.pexels.com/photos/4031818/pexels-photo-4031818.jpeg"
              alt="Telemedicine consultation"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-transparent opacity-20"></div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-16">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Complete Healthcare Solution
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Everything you need for modern healthcare, all in one platform
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Instant Doctor Chat",
                  description: "Connect with qualified doctors instantly through our secure messaging platform.",
                  icon: <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
                  color: "blue"
                },
                {
                  title: "Digital Prescriptions",
                  description: "Receive and manage your prescriptions digitally with easy pharmacy integration.",
                  icon: <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                  color: "green"
                },
                {
                  title: "Home Lab Tests",
                  description: "Professional lab technicians visit your home for sample collection and testing.",
                  icon: <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
                  color: "purple"
                },
                {
                  title: "Drug Delivery",
                  description: "Get your medications delivered directly to your doorstep with same-day delivery.",
                  icon: <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
                  color: "indigo"
                },
                {
                  title: "24/7 Support",
                  description: "Round-the-clock medical support and emergency consultation services.",
                  icon: <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                  color: "red"
                },
                {
                  title: "Secure & Private",
                  description: "Your health information is protected with enterprise-grade security and encryption.",
                  icon: <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
                  color: "yellow"
                }
              ].map((feature, index) => (
                <div key={index} className="relative group">
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 border border-gray-100">
                    <div className={`inline-flex items-center justify-center p-3 bg-gradient-to-r from-${feature.color}-500 to-${feature.color}-600 rounded-xl text-white mb-6`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Auth Form Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 m-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {showLogin ? 'Welcome Back' : 'Join MedAssist'}
            </h2>
            <p className="text-gray-600 mt-2">
              {showLogin ? 'Sign in to your healthcare portal' : 'Create your account and start your health journey'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!showLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="patient">👤 Patient</option>
                    <option value="doctor">👩‍⚕️ Doctor</option>
                    <option value="pharmacy">🏥 Pharmacy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {formData.role === 'doctor' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        placeholder="e.g., Cardiology, General Practice"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Medical License Number</label>
                      <input
                        type="text"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter your license number"
                      />
                    </div>
                  </>
                )}

                {formData.role === 'pharmacy' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pharmacy License</label>
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter pharmacy license number"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Please wait...</span>
                </>
              ) : (
                showLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setShowLogin(!showLogin);
                setError('');
                setFormData({
                  email: '',
                  password: '',
                  full_name: '',
                  role: 'patient',
                  phone: '',
                  specialization: '',
                  license_number: ''
                });
              }}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium hover:underline transition-colors duration-300"
            >
              {showLogin ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Components
const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [chats, setChats] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchDoctors();
    fetchChats();
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API}/users/doctors`);
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${API}/chats`);
      setChats(response.data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get(`${API}/prescriptions`);
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(`${API}/chats/${chatId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const startChat = async (doctorId) => {
    try {
      const response = await axios.post(`${API}/chats?doctor_id=${doctorId}`);
      setSelectedChat(response.data);
      setActiveTab('chat');
      fetchChats();
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await axios.post(`${API}/chats/${selectedChat.id}/messages?content=${encodeURIComponent(newMessage)}`);
      setNewMessage('');
      fetchMessages(selectedChat.id);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                className="h-8 w-8"
                src="https://images.unsplash.com/photo-1580115465903-0e4a824a4e9a"
                alt="MedAssist Logo"
              />
              <h1 className="text-xl font-semibold text-blue-600">MedAssist</h1>
              <span className="text-gray-400">|</span>
              <span className="text-lg text-gray-700">Patient Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.full_name}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['dashboard', 'doctors', 'chat', 'prescriptions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Chats</dt>
                        <dd className="text-lg font-medium text-gray-900">{chats.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Prescriptions</dt>
                        <dd className="text-lg font-medium text-gray-900">{prescriptions.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Available Doctors</dt>
                        <dd className="text-lg font-medium text-gray-900">{doctors.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Doctors Tab */}
          {activeTab === 'doctors' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {doctors.map((doctor) => (
                  <li key={doctor.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full"
                            src="https://images.unsplash.com/photo-1651008376811-b90baee60c1f"
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{doctor.full_name}</div>
                          <div className="text-sm text-gray-500">{doctor.specialization}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => startChat(doctor.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Start Chat
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat List */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Your Chats</h3>
                  <div className="space-y-3">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChat?.id === chat.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{chat.doctor_name}</div>
                        <div className="text-sm text-gray-500 truncate">{chat.last_message || 'No messages yet'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="lg:col-span-2 bg-white shadow rounded-lg">
                {selectedChat ? (
                  <div className="flex flex-col h-96">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        Dr. {selectedChat.doctor_name}
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === user.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={sendMessage}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <p className="text-gray-500">Select a chat to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {prescriptions.map((prescription) => (
                  <li key={prescription.id}>
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Dr. {prescription.doctor_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {prescription.diagnosis}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            prescription.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : prescription.status === 'dispensed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {prescription.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm text-gray-700">
                          <strong>Medications:</strong>
                          <ul className="mt-1 list-disc list-inside">
                            {prescription.medications.map((med, index) => (
                              <li key={index}>
                                {med.name} - {med.dosage} ({med.frequency})
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <strong>Instructions:</strong> {prescription.instructions}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    instructions: '',
    medications: [{ name: '', dosage: '', frequency: '' }]
  });

  useEffect(() => {
    fetchChats();
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${API}/chats`);
      setChats(response.data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get(`${API}/prescriptions`);
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(`${API}/chats/${chatId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      await axios.post(`${API}/chats/${selectedChat.id}/messages?content=${encodeURIComponent(newMessage)}`);
      setNewMessage('');
      fetchMessages(selectedChat.id);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const createPrescription = async () => {
    if (!selectedChat) return;

    try {
      await axios.post(`${API}/prescriptions`, {
        patient_id: selectedChat.patient_id,
        medications: prescriptionForm.medications,
        diagnosis: prescriptionForm.diagnosis,
        instructions: prescriptionForm.instructions
      });
      
      setShowPrescriptionForm(false);
      setPrescriptionForm({
        diagnosis: '',
        instructions: '',
        medications: [{ name: '', dosage: '', frequency: '' }]
      });
      fetchPrescriptions();
      alert('Prescription created successfully!');
    } catch (error) {
      console.error('Failed to create prescription:', error);
      alert('Failed to create prescription');
    }
  };

  const addMedication = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medications: [...prescriptionForm.medications, { name: '', dosage: '', frequency: '' }]
    });
  };

  const updateMedication = (index, field, value) => {
    const updatedMedications = [...prescriptionForm.medications];
    updatedMedications[index][field] = value;
    setPrescriptionForm({
      ...prescriptionForm,
      medications: updatedMedications
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                className="h-8 w-8"
                src="https://images.unsplash.com/photo-1580115465903-0e4a824a4e9a"
                alt="MedAssist Logo"
              />
              <h1 className="text-xl font-semibold text-blue-600">MedAssist</h1>
              <span className="text-gray-400">|</span>
              <span className="text-lg text-gray-700">Doctor Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Dr. {user.full_name}</span>
              <span className="text-sm text-gray-500">{user.specialization}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['dashboard', 'patients', 'prescriptions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Patients</dt>
                        <dd className="text-lg font-medium text-gray-900">{chats.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Prescriptions Written</dt>
                        <dd className="text-lg font-medium text-gray-900">{prescriptions.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Patients Tab */}
          {activeTab === 'patients' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient List */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Your Patients</h3>
                  <div className="space-y-3">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChat?.id === chat.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{chat.patient_name}</div>
                        <div className="text-sm text-gray-500 truncate">{chat.last_message || 'No messages yet'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="lg:col-span-2 bg-white shadow rounded-lg">
                {selectedChat ? (
                  <div className="flex flex-col h-96">
                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedChat.patient_name}
                      </h3>
                      <button
                        onClick={() => setShowPrescriptionForm(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        Write Prescription
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === user.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {message.sender_role === 'doctor' ? 'Dr.' : ''} {message.sender_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={sendMessage}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <p className="text-gray-500">Select a patient to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {prescriptions.map((prescription) => (
                  <li key={prescription.id}>
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Patient: {prescription.patient_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {prescription.diagnosis}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          prescription.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : prescription.status === 'dispensed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {prescription.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm text-gray-700">
                          <strong>Medications:</strong>
                          <ul className="mt-1 list-disc list-inside">
                            {prescription.medications.map((med, index) => (
                              <li key={index}>
                                {med.name} - {med.dosage} ({med.frequency})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Prescription Form Modal */}
      {showPrescriptionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Write Prescription</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                  <input
                    type="text"
                    value={prescriptionForm.diagnosis}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Medications</label>
                  {prescriptionForm.medications.map((med, index) => (
                    <div key={index} className="mt-2 grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Medicine name"
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Frequency"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addMedication}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                  >
                    + Add medication
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Instructions</label>
                  <textarea
                    value={prescriptionForm.instructions}
                    onChange={(e) => setPrescriptionForm({...prescriptionForm, instructions: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={createPrescription}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Prescription
                </button>
                <button
                  onClick={() => setShowPrescriptionForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PharmacyDashboard = () => {
  const { user, logout } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get(`${API}/prescriptions`);
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    }
  };

  const dispensePrescription = async (prescriptionId) => {
    try {
      await axios.patch(`${API}/prescriptions/${prescriptionId}/dispense`);
      fetchPrescriptions();
      alert('Prescription dispensed successfully!');
    } catch (error) {
      console.error('Failed to dispense prescription:', error);
      alert('Failed to dispense prescription');
    }
  };

  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending');
  const dispensedPrescriptions = prescriptions.filter(p => p.status === 'dispensed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                className="h-8 w-8"
                src="https://images.unsplash.com/photo-1580115465903-0e4a824a4e9a"
                alt="MedAssist Logo"
              />
              <h1 className="text-xl font-semibold text-blue-600">MedAssist</h1>
              <span className="text-gray-400">|</span>
              <span className="text-lg text-gray-700">Pharmacy Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user.full_name}</span>
              <span className="text-sm text-gray-500">License: {user.license_number}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['dashboard', 'pending', 'dispensed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'pending' ? `Pending (${pendingPrescriptions.length})` : 
                   tab === 'dispensed' ? `Dispensed (${dispensedPrescriptions.length})` : 
                   tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Prescriptions</dt>
                        <dd className="text-lg font-medium text-gray-900">{pendingPrescriptions.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Dispensed Today</dt>
                        <dd className="text-lg font-medium text-gray-900">{dispensedPrescriptions.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Prescriptions</dt>
                        <dd className="text-lg font-medium text-gray-900">{prescriptions.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Prescriptions Tab */}
          {activeTab === 'pending' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Pending Prescriptions</h3>
                <ul className="divide-y divide-gray-200">
                  {pendingPrescriptions.map((prescription) => (
                    <li key={prescription.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              Patient: {prescription.patient_name}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <strong>Doctor:</strong> Dr. {prescription.doctor_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Diagnosis:</strong> {prescription.diagnosis}
                            </p>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 font-medium">Medications:</p>
                              <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                                {prescription.medications.map((med, index) => (
                                  <li key={index}>
                                    {med.name} - {med.dosage} ({med.frequency})
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                              <strong>Instructions:</strong> {prescription.instructions}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => dispensePrescription(prescription.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Dispense
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {pendingPrescriptions.length === 0 && (
                    <li className="py-4">
                      <p className="text-gray-500 text-center">No pending prescriptions</p>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Dispensed Prescriptions Tab */}
          {activeTab === 'dispensed' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Dispensed Prescriptions</h3>
                <ul className="divide-y divide-gray-200">
                  {dispensedPrescriptions.map((prescription) => (
                    <li key={prescription.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              Patient: {prescription.patient_name}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Dispensed
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <strong>Doctor:</strong> Dr. {prescription.doctor_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Diagnosis:</strong> {prescription.diagnosis}
                            </p>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 font-medium">Medications:</p>
                              <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                                {prescription.medications.map((med, index) => (
                                  <li key={index}>
                                    {med.name} - {med.dosage} ({med.frequency})
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {prescription.dispensed_at && (
                              <p className="mt-2 text-sm text-gray-500">
                                <strong>Dispensed:</strong> {new Date(prescription.dispensed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {dispensedPrescriptions.length === 0 && (
                    <li className="py-4">
                      <p className="text-gray-500 text-center">No dispensed prescriptions</p>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
function AppContent() {
  const { isAuthenticated, user } = useAuth();

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case 'patient':
        return <PatientDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'pharmacy':
        return <PharmacyDashboard />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="App">
      {!isAuthenticated ? <LandingPage /> : renderDashboard()}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
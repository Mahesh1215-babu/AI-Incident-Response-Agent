import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark'); // Default to dark theme

  // Initialize Auth & Theme
  useEffect(() => {
    // 1. Auth Setup
    const storedUser = localStorage.getItem('agent_user');
    const token = localStorage.getItem('agent_token');
    
    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser({ ...parsedUser, token });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);

    // 2. Theme Setup
    const savedTheme = localStorage.getItem('agent_theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('agent_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  };

  const login = async (email, password) => {
    try {
      // Connect to FastAPI backend running on port 8000
      const response = await axios.post('http://127.0.0.1:8000/login', { email, password });
      const { access_token, role, email: resEmail } = response.data;
      
      const userData = { email: resEmail, role };
      localStorage.setItem('agent_token', access_token);
      localStorage.setItem('agent_user', JSON.stringify(userData));
      
      setUser({ ...userData, token: access_token });
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      const message = error.response?.data?.detail || "Invalid credentials. Please try again.";
      return { success: false, error: message };
    }
  };

  const signup = async (email, password, role = 'engineer') => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/signup', { email, password, role });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Signup failed:", error);
      const message = error.response?.data?.detail || "Signup failed. Please try again.";
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/logout');
    } catch (e) {
      console.warn("Logout endpoint call failed:", e);
    }
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, theme, toggleTheme }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

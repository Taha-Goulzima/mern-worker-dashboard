import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService, register as registerService } from '../services/authService';
import { uploadProfilePicture, updateUserProfile, getCurrentUser } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = await getCurrentUser();
        console.log('User data:', userData);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const response = await loginService(credentials);
      console.log('Login response:', response);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await registerService({ name, email, password });
      console.log('Register response:', response);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await updateUserProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const updateProfilePicture = async (formData) => {
    try {
      const response = await uploadProfilePicture(formData);
      setUser(prevUser => ({
        ...prevUser,
        profilePicture: response.profilePicture
      }));
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateProfilePicture
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('clauseguard_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userId) => {
    try {
      const userData = await userService.getUser(userId);
      setUser(userData);
      localStorage.setItem('clauseguard_user', JSON.stringify(userData));
      toast.success('Successfully logged in!');
      return userData;
    } catch (error) {
      toast.error('Failed to log in. Please check your User ID.');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const newUser = await userService.createUser(userData);
      setUser(newUser);
      localStorage.setItem('clauseguard_user', JSON.stringify(newUser));
      toast.success('Account created successfully!');
      return newUser;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register account.');
      throw error;
    }
  };

  const loginWithGoogle = async (googleData) => {
    try {
      const userData = await userService.googleLogin(googleData);
      setUser(userData);
      localStorage.setItem('clauseguard_user', JSON.stringify(userData));
      toast.success('Successfully logged in with Google!');
      return userData;
    } catch (error) {
      toast.error('Failed to log in with Google.');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('clauseguard_user');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  userId: string | null;
  userType: 'USER' | 'TRAINER' | null;
  login: (refreshToken: string, id: string, type: 'USER' | 'TRAINER') => Promise<void>;
  logout: () => Promise<void>;
}

const defaultContextValue: AuthContextType = {
  userId: null,
  userType: null,
  login: async () => {
    throw new Error('login not implemented');
  },
  logout: async () => {
    throw new Error('logout not implemented');
  }
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'USER' | 'TRAINER' | null>(null);

  useEffect(() => {
    const loadAuthInfo = async () => {
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const storedUserId = await AsyncStorage.getItem('memberId');
          const storedUserType = await AsyncStorage.getItem('userType') as 'USER' | 'TRAINER' | null;
          
          setUserId(storedUserId);
          setUserType(storedUserType);
        }
      } catch (error) {
        console.error('Failed to load auth info:', error);
      }
    };

    loadAuthInfo();
  }, []);

  const login = async (
    refreshToken: string, 
    id: string, 
    type: 'USER' | 'TRAINER'
  ) => {
    try {
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('memberId', id);
      await AsyncStorage.setItem('userType', type);
      
      setUserId(id);
      setUserType(type);
    } catch (error) {
      console.error('Failed to save auth info:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['refreshToken', 'memberId', 'userType']);
      setUserId(null);
      setUserType(null);
    } catch (error) {
      console.error('Failed to remove auth info:', error);
      throw error;
    }
  };

  const value = {
    userId,
    userType,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;
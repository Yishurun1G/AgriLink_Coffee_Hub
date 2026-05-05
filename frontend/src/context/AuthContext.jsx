// src/context/AuthContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user if token exists on app start
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me/');
            setUser(res.data);
            return res.data;
        } catch (error) {
            // Only clear tokens if it's truly a 401 that the interceptor
            // couldn't recover from (interceptor already removed tokens in that case)
            console.error("Failed to fetch user:", error);
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const res = await api.post('/token/', { username, password });

            localStorage.setItem('access_token', res.data.access);
            if (res.data.refresh) {
                localStorage.setItem('refresh_token', res.data.refresh);
            }

            // Fetch and return user data
            const userData = await fetchUser();
            return userData;

        } catch (error) {
            console.error("Login failed:", error.response?.data || error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            loading,
            isAuthenticated: !!user 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
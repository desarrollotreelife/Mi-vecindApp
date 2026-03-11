import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api', // Functionality for local dev
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
    // Use localStorage for persistence across module navigation
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
// Interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('Session expired or unauthorized. Logging out.');
            // Clear BOTH storages to be safe
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');

            if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/ingreso')) {
                window.location.href = '/login';
            }
        }
        // For 403, we just let the component handle the error without kicking the user out
        return Promise.reject(error);
    }
);

export default api;

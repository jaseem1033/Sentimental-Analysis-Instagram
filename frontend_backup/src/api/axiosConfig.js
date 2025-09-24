import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
    // IMPORTANT: Replace this with your actual Django backend URL
    baseURL: 'http://127.0.0.1:8000/api',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add a request interceptor to include the token in every request
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
import axios, { AxiosError } from 'axios';

// Define token key constants to match authService.ts
const TOKEN_KEY = 'invaise_auth_token';

// Create base axios instances for each service
export const businessDomainApi = axios.create({
  baseURL: process.env.REACT_APP_BUSINESS_DOMAIN_URL || 'http://localhost:5116',
  withCredentials: false, // Change to false to avoid CORS preflight issues
  timeout: 10000, // Set timeout to 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const apolloApi = axios.create({
  baseURL: process.env.REACT_APP_APOLLO_URL || 'http://localhost:5001',
});

export const ignisApi = axios.create({
  baseURL: process.env.REACT_APP_IGNIS_URL || 'http://localhost:5002',
});

export const gaiaApi = axios.create({
  baseURL: process.env.REACT_APP_GAIA_URL || 'http://localhost:5003',
});

// Add auth token interceptor for all API instances
const addAuthInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.request.use(
    (config: any) => {
      // Get token from localStorage using the correct key
      const token = localStorage.getItem(TOKEN_KEY);
      
      // If token exists, add it to the Authorization header
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error: any) => Promise.reject(error)
  );
};

// Add interceptors for error handling
const addErrorInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.response.use(
    (response: any) => response,
    (error: AxiosError) => {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error:', error.response.data);
        console.error('Status code:', error.response.status);
        
        // Handle 401 Unauthorized errors (token expired or invalid)
        if (error.response.status === 401) {
          console.log('Unauthorized: Token may be expired or invalid');
          // Optionally redirect to login or clear token
          // localStorage.removeItem(TOKEN_KEY);
          // window.location.href = '/login';
        }
        
        // Extract error message if available
        const data = error.response.data as any;
        if (data?.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request error:', error.request);
        
        // More specific message for CORS errors
        if (error.message === 'Network Error') {
          errorMessage = 'CORS error: Unable to connect to the server. This is likely a CORS configuration issue. Please ensure the backend allows requests from this origin.';
        } else {
          errorMessage = 'No response received from server. Please check your network connection.';
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        errorMessage = error.message;
      }
      
      // Create a more informative error object
      const enhancedError = {
        ...error,
        userMessage: errorMessage
      };
      
      return Promise.reject(enhancedError);
    }
  );
};

// Add auth interceptors to all API instances
addAuthInterceptor(businessDomainApi);
addAuthInterceptor(apolloApi);
addAuthInterceptor(ignisApi);
addAuthInterceptor(gaiaApi);

// Add error interceptors to all API instances
addErrorInterceptor(businessDomainApi);
addErrorInterceptor(apolloApi);
addErrorInterceptor(ignisApi);
addErrorInterceptor(gaiaApi); 
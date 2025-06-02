import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'invaise_auth_token';

export const SESSION_EXPIRED_EVENT = 'session_expired';
export const SESSION_ABOUT_TO_EXPIRE_EVENT = 'session_about_to_expire';

export const dispatchSessionEvent = (eventType: string) => {
  const event = new CustomEvent(eventType);
  document.dispatchEvent(event);
};

export const businessDomainApi = axios.create({
  baseURL: process.env.REACT_APP_BUSINESS_DOMAIN_URL || 'https://localhost:7223',
  withCredentials: false,
  timeout: 10000,
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

const addAuthInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem(TOKEN_KEY);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error: any) => Promise.reject(error)
  );
};

const addErrorInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.response.use(
    (response: any) => response,
    (error: AxiosError) => {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        console.error('Response error:', error.response.data);
        console.error('Status code:', error.response.status);
        
        if (error.response.status === 401) {
          dispatchSessionEvent(SESSION_EXPIRED_EVENT);
        }
        
        const data = error.response.data as any;
        if (data?.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (error.request) {
        console.error('Request error:', error.request);
        
        if (error.message === 'Network Error') {
          errorMessage = 'CORS error: Unable to connect to the server. This is likely a CORS configuration issue. Please ensure the backend allows requests from this origin.';
        } else {
          errorMessage = 'No response received from server. Please check your network connection.';
        }
      } else {
        console.error('Error setting up request:', error.message);
        errorMessage = error.message;
      }
      
      const enhancedError = {
        ...error,
        userMessage: errorMessage
      };
      
      return Promise.reject(enhancedError);
    }
  );
};

addAuthInterceptor(businessDomainApi);
addAuthInterceptor(apolloApi);
addAuthInterceptor(ignisApi);
addAuthInterceptor(gaiaApi);

addErrorInterceptor(businessDomainApi);
addErrorInterceptor(apolloApi);
addErrorInterceptor(ignisApi);
addErrorInterceptor(gaiaApi); 
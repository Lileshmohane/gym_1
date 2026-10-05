import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Use the computer's LAN address for Expo Go on a physical device. Override this
// with EXPO_PUBLIC_API_URL for another network or a deployed backend.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.35:8080";

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 10000,
});

// Attach the access token to every request.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, attempt exactly one refresh-and-retry before forcing logout —
// matches the mobile architecture spec in the Technical Architecture Document (6.2).
let isRefreshing = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    	if (__DEV__) {
      		const method = originalRequest?.method?.toUpperCase() ?? "REQUEST";
      		const path = originalRequest?.url ?? "<unknown>";
      		const status = error.response?.status ?? "network error";
      		console.error(`[api] ${method} ${path} failed (${status})`);
    	}
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { refreshToken } = useAuthStore.getState();
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken });
        await useAuthStore.getState().login(useAuthStore.getState().user!, data.accessToken, data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

import { LogoutUser } from "@/redux/slices/actions/authActions";
import { updateUser } from "@/redux/slices/userSlice";
import axios from "@/utils/axios";

let store;

export const injectStore = (_store) => {
  store = _store;
};

// Function to refresh token
const refreshToken = async () => {
  // Make a request to your backend to refresh the token
  // Example:
  const { data } = await axios.post("/auth/refresh-token/");
  return data; // Assuming the new token is returned in the response
};

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const { dispatch } = store;
    const { isLoggedIn } = store.getState().auth;

    // Check if the error is an unauthorized error
    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      isLoggedIn
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const { user } = await refreshToken();

        // If successful, add the new token to the request headers
        originalRequest.headers["Authorization"] = "Bearer " + user.token;

        // Dispatch the updateUser action with the new user data
        await dispatch(updateUser(user));
        // Resend the original request with the new token
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, logout user
        alert("Token expired, Please login again...");
        dispatch(LogoutUser());
      }
    }

    // If the error is not unauthorized or refresh token fails, just throw the error
    return Promise.reject(
      (error.response && error.response.data) || "Axios - Something went wrong"
    );
  }
);

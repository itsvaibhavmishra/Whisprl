import axios from "axios";

// Function to check if the email is disposable using Debounce API
export const isDisposableEmail = async (email) => {
  try {
    const { data } = await axios.get("https://disposable.debounce.io/", { params: { email }, timeout: 5000 });
    return data.disposable === "true"; // Convert the string to boolean
  } catch (error) {
    console.error("Error while checking disposable email:", error.message);
    return false;
  }
};

import axios from "axios";
import { showAlert } from "./alerts";

//type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  const url =
    type === "password"
      ? "/api/v1/users/update-password"
      : "/api/v1/users/update-me";
  try {
    const resp = await axios.patch(url, data);
    if (resp.data.status === "success") {
      showAlert("success", `${type} updated successfully`);
    }
  } catch (err) {
    showAlert(
      "error",
      err?.response?.data?.message ?? "Error updating user data"
    );
  }
};

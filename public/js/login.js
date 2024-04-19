import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login", //Since the client and the API are hosted in the same server, this works, it's a relative path
      data: {
        email,
        password,
      },
    });
    if (res.data.status === "success") {
      showAlert("success", "Logged in successfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err?.response?.data?.message ?? "Error logging in");
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/logout",
    });
    if ((res.data.status = "success")) location.reload(true); //we really want a reload page
  } catch (err) {
    showAlert("error", "Error logging out");
    console.log(err.response);
  }
};

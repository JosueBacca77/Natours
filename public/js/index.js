import "@babel/polyfill";
import { login, logout } from "./login";
import { updateSettings } from "./updateSettings";
import { bookTour } from "./bookings";
import { showAlert } from "./alerts";

//DOM elements
const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const updateSettingForm = document.querySelector(".form-user-data");
const updatePasswordForm = document.querySelector(".form-user-password");
const bookTourBtn = document.querySelector("#book-tour");

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}
if (logOutBtn) {
  logOutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    logout();
  });
}

if (bookTourBtn) {
  bookTourBtn.addEventListener("click", function (e) {
    e.preventDefault();
    bookTourBtn.textContent = "Processing...";
    bookTour(bookTourBtn.dataset.tourId);
  });
}

if (updateSettingForm) {
  updateSettingForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const form = new FormData();

    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);

    updateSettings(form, "data");
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating...";
    const currentPassword = document.getElementById("password-current").value;
    const confirmPassword = document.getElementById("password-confirm").value;
    const password = document.getElementById("password").value;

    const data = { currentPassword, confirmPassword, password };
    await updateSettings(data, "password");

    document.querySelector(".btn--save-password").textContent = "Save passwor";
    document.getElementById("password-current").value = "";
    document.getElementById("password-confirm").value = "";
  });
}

const alertMessage = document.querySelector("body").dataset.alert;
if (alert) showAlert("success", alertMessage, 16);

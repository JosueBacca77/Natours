import axios from "axios";
import { showAlert } from "./alerts";
const stripe = Stripe(
  "pk_test_51P5HHMJj56PEqob1Pvry838MaLuKwyVEmIJ6rIDp0WmgjC6IZTeC40o0vCfHg3Lfpl9inukSWimUi6kFq4mSB5h100msw6n19S"
);

export const bookTour = async (tourId) => {
  try {
    //1) Get heckout tour from API
    const res = await axios({
      method: "GET",
      url: `/api/v1/bookings/checkout-session/${tourId}`,
    });
    if (res.data.status === "success") {
      showAlert("success", "Session created succesfully");
    }
    //2) Create checkout form + charge credit card

    const purchaseResp = await stripe.redirectToCheckout({
      sessionId: res.data.session.id,
    });
  } catch (err) {
    showAlert("error", err?.response?.data?.message ?? "Error booking tour");
  }
};

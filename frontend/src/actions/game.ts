import * as api from "../api";
import * as messages from "../messages";
import {PlaceWagerFormData} from "../types/actionTypes";

export const placeWager = (formData: PlaceWagerFormData) =>
  async () => {
    try {
      const { data } = await api.placeWager(formData);
      messages.success("Wager Placed Successfully");
    } catch (error: any) {
      messages.error(error.response?.data?.message || "Wager Place failed");
    }
  };
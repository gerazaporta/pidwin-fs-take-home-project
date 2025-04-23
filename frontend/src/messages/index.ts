import { toast, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastOptions: ToastOptions = {
  position: "bottom-left",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

export const success = (message: string) =>
  toast.success(message, toastOptions);

export const error = (message: string) =>
  toast.error(message, toastOptions);

export const warning = (message: string) =>
  toast.warning(message, toastOptions);

export const info = (message: string) =>
  toast(message, toastOptions);
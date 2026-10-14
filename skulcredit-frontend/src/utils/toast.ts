import { toast, ToastOptions } from "react-toastify";

const base: ToastOptions = {
  position: "bottom-right",
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
  theme: "colored",
};

export const toastSuccess = (msg: string) => toast.success(msg, base);
export const toastError   = (msg: string) => toast.error(msg, base);
export const toastWarning = (msg: string) => toast.warning(msg, base);
export const toastInfo    = (msg: string) => toast.info(msg, base);

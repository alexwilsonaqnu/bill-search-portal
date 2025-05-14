
import { toast as sonnerToast } from "sonner";

// Create a properly callable toast function with enhanced types
const toast = (message: string, data?: any) => sonnerToast(message, data);

// Add convenience methods
toast.error = (message: string, data?: any) => sonnerToast.error(message, data);
toast.success = (message: string, data?: any) => sonnerToast.success(message, data);
toast.warning = (message: string, data?: any) => sonnerToast.warning(message, data);
toast.info = (message: string, data?: any) => sonnerToast.info(message, data);
toast.promise = sonnerToast.promise;
toast.dismiss = sonnerToast.dismiss;
toast.custom = sonnerToast.custom;

export { toast };

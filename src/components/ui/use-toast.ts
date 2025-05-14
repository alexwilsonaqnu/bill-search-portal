
import { toast as sonnerToast } from "sonner";

// Re-export sonner toast with enhanced typing
export const toast = {
  ...sonnerToast,
  // Add convenience methods with proper typing
  error: (message: string, data?: any) => sonnerToast.error(message, data),
  success: (message: string, data?: any) => sonnerToast.success(message, data),
  warning: (message: string, data?: any) => sonnerToast.warning(message, data),
  info: (message: string, data?: any) => sonnerToast.info(message, data)
};

export { toast };

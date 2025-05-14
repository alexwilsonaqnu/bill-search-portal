import { toast as sonnerToast } from "sonner";

// Define a toast type that accepts either string or object parameters
type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  [key: string]: any;
};

// Create a properly callable toast function with enhanced types
const toast = (props: string | ToastProps, data?: any) => {
  if (typeof props === 'string') {
    return sonnerToast(props, data);
  } else {
    // Handle object format
    const { title, description, variant, ...rest } = props;
    return sonnerToast(title || '', {
      description,
      ...rest
    });
  }
};

// Add convenience methods
toast.error = (message: string | ToastProps, data?: any) => {
  if (typeof message === 'string') {
    return sonnerToast.error(message, data);
  } else {
    const { title, description, ...rest } = message;
    return sonnerToast.error(title || '', { description, ...rest });
  }
};

toast.success = (message: string | ToastProps, data?: any) => {
  if (typeof message === 'string') {
    return sonnerToast.success(message, data);
  } else {
    const { title, description, ...rest } = message;
    return sonnerToast.success(title || '', { description, ...rest });
  }
};

toast.warning = (message: string | ToastProps, data?: any) => {
  if (typeof message === 'string') {
    return sonnerToast.warning(message, data);
  } else {
    const { title, description, ...rest } = message;
    return sonnerToast.warning(title || '', { description, ...rest });
  }
};

toast.info = (message: string | ToastProps, data?: any) => {
  if (typeof message === 'string') {
    return sonnerToast.info(message, data);
  } else {
    const { title, description, ...rest } = message;
    return sonnerToast.info(title || '', { description, ...rest });
  }
};

toast.promise = sonnerToast.promise;
toast.dismiss = sonnerToast.dismiss;
toast.custom = sonnerToast.custom;

export { toast };

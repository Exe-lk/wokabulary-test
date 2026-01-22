import Swal from 'sweetalert2';

// Success alert
export const showSuccessAlert = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    confirmButtonColor: '#06B6D4',// Green color
    confirmButtonText: 'OK',
    timer: 3000,
    timerProgressBar: true,
  });
};

// Error alert
export const showErrorAlert = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: '#EF4444', // Red color
    confirmButtonText: 'OK',
  });
};

// Warning alert
export const showWarningAlert = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonColor: '#F59E0B', // Amber color
    confirmButtonText: 'OK',
  });
};

// Info alert
export const showInfoAlert = (title: string, message?: string) => {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
    confirmButtonColor: '#3B82F6', // Blue color
    confirmButtonText: 'OK',
  });
};

// Confirmation dialog
export const showConfirmDialog = (
  title: string,
  message: string,
  confirmButtonText: string = 'Yes',
  cancelButtonText: string = 'No'
) => {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#6B7280',
    confirmButtonText,
    cancelButtonText,
  });
};

// Custom alert with HTML content
export const showCustomAlert = (options: {
  title: string;
  html?: string;
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  confirmButtonText?: string;
  showCancelButton?: boolean;
  cancelButtonText?: string;
  timer?: number;
}) => {
  return Swal.fire({
    icon: options.icon || 'info',
    title: options.title,
    html: options.html,
    confirmButtonText: options.confirmButtonText || 'OK',
    showCancelButton: options.showCancelButton || false,
    cancelButtonText: options.cancelButtonText || 'Cancel',
    timer: options.timer,
    timerProgressBar: options.timer ? true : false,
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#6B7280',
  });
};

// Loading alert
export const showLoadingAlert = (title: string = 'Loading...') => {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close any open alert
export const closeAlert = () => {
  Swal.close();
}; 
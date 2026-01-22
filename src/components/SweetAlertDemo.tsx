"use client";

import { 
  showSuccessAlert, 
  showErrorAlert, 
  showWarningAlert, 
  showInfoAlert, 
  showConfirmDialog, 
  showCustomAlert,
  showLoadingAlert,
  closeAlert 
} from '@/lib/sweetalert';

export default function SweetAlertDemo() {
  const handleSuccessAlert = () => {
    showSuccessAlert('Success!', 'Operation completed successfully.');
  };

  const handleErrorAlert = () => {
    showErrorAlert('Error!', 'Something went wrong. Please try again.');
  };

  const handleWarningAlert = () => {
    showWarningAlert('Warning!', 'Please review your input before proceeding.');
  };

  const handleInfoAlert = () => {
    showInfoAlert('Information', 'Here is some important information for you.');
  };

  const handleConfirmDialog = async () => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'This action cannot be undone. Do you want to continue?',
      'Yes, continue',
      'Cancel'
    );
    
    if (result.isConfirmed) {
      showSuccessAlert('Confirmed!', 'You clicked the confirm button.');
    } else {
      showInfoAlert('Cancelled', 'You cancelled the operation.');
    }
  };

  const handleCustomAlert = () => {
    showCustomAlert({
      title: 'Custom Alert',
      html: `
        <div class="text-left">
          <p class="mb-2">This is a custom alert with HTML content.</p>
          <ul class="list-disc list-inside text-sm">
            <li>Feature 1: Rich HTML content</li>
            <li>Feature 2: Custom styling</li>
            <li>Feature 3: Flexible options</li>
          </ul>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Got it!',
      timer: 5000,
    });
  };

  const handleLoadingAlert = () => {
    showLoadingAlert('Processing your request...');
    
    // Simulate some async operation
    setTimeout(() => {
      closeAlert();
      showSuccessAlert('Done!', 'Your request has been processed successfully.');
    }, 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">SweetAlert2 Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleSuccessAlert}
          className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Success Alert
        </button>
        
        <button
          onClick={handleErrorAlert}
          className="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Error Alert
        </button>
        
        <button
          onClick={handleWarningAlert}
          className="p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Warning Alert
        </button>
        
        <button
          onClick={handleInfoAlert}
          className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Info Alert
        </button>
        
        <button
          onClick={handleConfirmDialog}
          className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Confirmation Dialog
        </button>
        
        <button
          onClick={handleCustomAlert}
          className="p-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          Custom Alert
        </button>
        
        <button
          onClick={handleLoadingAlert}
          className="p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Loading Alert
        </button>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Available Functions:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><code>showSuccessAlert(title, message?)</code> - Green success alert with auto-close</li>
          <li><code>showErrorAlert(title, message?)</code> - Red error alert</li>
          <li><code>showWarningAlert(title, message?)</code> - Yellow warning alert</li>
          <li><code>showInfoAlert(title, message?)</code> - Blue info alert</li>
          <li><code>showConfirmDialog(title, message, confirmText?, cancelText?)</code> - Confirmation dialog</li>
          <li><code>showCustomAlert(options)</code> - Custom alert with HTML content</li>
          <li><code>showLoadingAlert(title?)</code> - Loading spinner</li>
          <li><code>closeAlert()</code> - Close any open alert</li>
        </ul>
      </div>
    </div>
  );
} 
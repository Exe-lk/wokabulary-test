"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, MapPin, Phone, Mail, Clock, User, CreditCard, DollarSign } from 'lucide-react';
import Image from 'next/image';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialRequests: string | null;
  foodItem: {
    name: string;
    description: string | null;
  };
  portion: {
    name: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  receivedAmount: number;
  balance: number;
  paymentDate: string;
  paymentMode: 'CASH' | 'CARD';
  referenceNumber: string | null;
}

interface Order {
  id: number;
  tableNumber: number | null;
  totalAmount: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  billNumber: string | null;
  createdAt: string;
  updatedAt: string;
  staff: {
    name: string;
    email: string;
  };
  orderItems: OrderItem[];
  payments?: Payment[];
}

export default function BillPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/bill/${orderId}`);
        if (!response.ok) {
          throw new Error('Order not found');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          setServiceChargeRate(settings.serviceChargeRate || 0);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };

    if (orderId) {
      fetchOrder();
      fetchSettings();
    }
  }, [orderId]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setDownloadError('');
    try {
      const response = await fetch(`/api/bill/${orderId}/pdf`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
      
      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Invalid response format. Expected PDF.');
      }
      
      const blob = await response.blob();
      
      // Verify blob is not empty
      if (blob.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      // Create download using blob URL
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `bill-${orderId}.pdf`;
      
      // Ensure link is in the document
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      setDownloadError(err.message || 'Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">Loading bill...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Bill...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h1>
          <p className="text-gray-600">{error || 'The requested bill could not be found.'}</p>
        </div>
      </div>
    );
  }

  const subtotal = order.totalAmount;
  const serviceCharge = subtotal * (serviceChargeRate / 100);
  const total = subtotal + serviceCharge;

  return (
    <div className="min-h-screen bg-gray-50 py-2 sm:py-4">
      <div className="max-w-2xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Compact Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" id="bill-content">
          {/* Restaurant Header - Mobile Responsive */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-1.5 rounded-lg">
                  <Image
                    src="/images/logo.png"
                    alt="Restaurant Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">Wokabulary</h1>
                  <p className="text-blue-100 text-xs sm:text-sm">Fine Dining Experience</p>
                </div>
              </div>
              <div className="text-left sm:text-right text-xs sm:text-sm">
                <p className="text-blue-100 flex items-center mb-1">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="break-words">49 Old Kottawa Rd, Nugegoda 10250</span>
                </p>
                <p className="text-blue-100 flex items-center">
                  <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                  076 608 7824
                </p>
              </div>
            </div>
          </div>

          {/* Bill Content - Mobile Responsive */}
          <div className="p-3 sm:p-4">
            {/* Bill Info Section - Mobile Responsive */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0 mb-4">
              <div className="flex-1">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">BILL #{order.id}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm">
                  {order.tableNumber && (
                    <p className="flex items-center text-gray-700">
                      <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span>Table {order.tableNumber}</span>
                    </p>
                  )}
                  {order.billNumber && (
                    <p className="flex items-center text-gray-700">
                      <CreditCard className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span>Bill {order.billNumber}</span>
                    </p>
                  )}
                  <p className="flex items-center text-gray-700">
                    <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span>{formatDate(order.createdAt)}</span>
                  </p>
                  <p className="flex items-center text-gray-700">
                    <User className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span>{order.staff.name}</span>
                  </p>
                  <p className="flex items-center text-gray-700">
                    <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span>{formatTime(order.createdAt)}</span>
                  </p>
                </div>
              </div>

              {/* Customer Information - Mobile Responsive */}
              {(order.customerName || order.customerEmail || order.customerPhone) && (
                <div className="bg-gray-50 p-3 rounded-lg text-xs sm:text-sm lg:max-w-xs">
                  <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                  <div className="space-y-1">
                    {order.customerName && (
                      <p className="text-gray-700">
                        <span className="font-medium">Name:</span> {order.customerName}
                      </p>
                    )}
                    {order.customerEmail && (
                      <p className="text-gray-700 break-words">
                        <span className="font-medium">Email:</span> {order.customerEmail}
                      </p>
                    )}
                    {order.customerPhone && (
                      <p className="text-gray-700">
                        <span className="font-medium">Phone:</span> {order.customerPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Items - Mobile Responsive */}
            <div className="border-t border-gray-200 pt-3">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Order Details</h3>
              
              {/* Mobile Card Layout - Hidden on sm and up */}
              <div className="sm:hidden space-y-3">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{item.foodItem.name}</p>
                        {item.foodItem.description && (
                          <p className="text-xs text-gray-600 mt-1">{item.foodItem.description}</p>
                        )}
                        {item.specialRequests && (
                          <p className="text-xs text-blue-600 italic mt-1">Special: {item.specialRequests}</p>
                        )}
                      </div>
                      <div className="text-right ml-3">
                        <p className="font-bold text-gray-900 text-sm">Rs. {item.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>{item.portion.name} • Qty: {item.quantity}</span>
                      <span>Rs. {item.unitPrice.toFixed(2)} each</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout - Hidden on mobile */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-600 font-medium">Item</th>
                      <th className="text-center py-2 text-gray-600 font-medium">Portion</th>
                      <th className="text-center py-2 text-gray-600 font-medium">Qty</th>
                      <th className="text-right py-2 text-gray-600 font-medium">Price</th>
                      <th className="text-right py-2 text-gray-600 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.orderItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.foodItem.name}</p>
                            {item.foodItem.description && (
                              <p className="text-xs text-gray-600">{item.foodItem.description}</p>
                            )}
                            {item.specialRequests && (
                              <p className="text-xs text-blue-600 italic">Special: {item.specialRequests}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-center text-gray-700 text-sm">{item.portion.name}</td>
                        <td className="py-2 text-center text-gray-700 text-sm">{item.quantity}</td>
                        <td className="py-2 text-right text-gray-700 text-sm">Rs. {item.unitPrice.toFixed(2)}</td>
                        <td className="py-2 text-right font-medium text-gray-900 text-sm">Rs. {item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Information */}
            {order.payments && order.payments.length > 0 && (
              <div className="border-t border-gray-200 pt-3 mt-3">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Payment Information</h3>
                {order.payments.map((payment) => (
                  <div key={payment.id} className="bg-gray-50 p-3 rounded-lg mb-2">
                    <div className="space-y-1 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Payment Mode:</span>
                        <span className="font-medium flex items-center">
                          {payment.paymentMode === 'CARD' ? (
                            <CreditCard className="w-3 h-3 mr-1" />
                          ) : (
                            <DollarSign className="w-3 h-3 mr-1" />
                          )}
                          {payment.paymentMode}
                        </span>
                      </div>
                      {payment.referenceNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Reference Number:</span>
                          <span className="font-medium">{payment.referenceNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-700">Amount Paid:</span>
                        <span className="font-medium">Rs. {payment.receivedAmount.toFixed(2)}</span>
                      </div>
                      {payment.balance > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Balance:</span>
                          <span className="font-medium text-green-600">Rs. {payment.balance.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bill Summary - Mobile Responsive */}
            <div className="border-t border-gray-300 pt-3 mt-3">
              <div className="max-w-xs ml-auto">
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  {serviceChargeRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Service ({serviceChargeRate}%):</span>
                      <span className="font-medium">Rs. {serviceCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base font-bold text-gray-900 pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>Rs. {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Mobile Responsive */}
            <div className="border-t border-gray-200 pt-3 mt-4 text-center">
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Thank you for dining with us!</p>
              <p className="text-xs text-gray-500">We hope to see you again soon.</p>
            </div>
          </div>
        </div>

        {/* Download Button - Mobile Responsive */}
        <div className="mt-3 sm:mt-4 text-center px-4">
          {downloadError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {downloadError}
            </div>
          )}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm sm:text-base mx-auto"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 
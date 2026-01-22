"use client";

import { useState, useEffect } from 'react';










































































































































































import { X, Mail, User, Phone, Send, MessageSquare } from 'lucide-react';
import { showSuccessAlert } from '@/lib/sweetalert';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    tableNumber: number;
    totalAmount: number;
    orderItems: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      specialRequests: string | null;
      foodItem: {
        name: string;
      };
      portion: {
        name: string;
      };
    }>;
    customer?: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
  };
  onBillSent: () => void;
}

export default function BillModal({ isOpen, onClose, order, onBillSent }: BillModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [smsStatus, setSmsStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Generate bill number when modal opens
  useEffect(() => {
    if (isOpen) {
      // Generate auto bill number: BILL-YYYYMMDD-XXXX
      const now = new Date();
      const dateStr = now.getFullYear().toString() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setBillNumber(`BILL-${dateStr}-${randomNum}`);
      
      // Pre-populate customer data if available
      if (order.customer) {
        setCustomerName(order.customer.name || '');
        setCustomerEmail(order.customer.email || '');
        setCustomerPhone(order.customer.phone || '');
      } else {
        // Reset form if no customer data
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
      }
      
      // Clear any previous errors and status
      setError('');
      setSmsStatus('idle');
    }
  }, [isOpen, order.customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerEmail) {
      setError('Email is required to send the bill');
      return;
    }

    setIsSending(true);
    setError('');
    setSmsStatus('idle');

    try {
      const response = await fetch(`/api/orders/${order.id}/bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: customerName || null,
          customerEmail,
          customerPhone: customerPhone || null,
          billNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send bill');
      }

      const result = await response.json();
      
      // Check SMS status
      if (customerPhone && result.smsResult) {
        if (result.smsResult.success) {
          setSmsStatus('success');
        } else {
          setSmsStatus('error');
          const smsError = result.smsResult.error || 'Unknown SMS error';
          console.error('SMS failed:', smsError);
          
          // Show specific error message for SMS failure
          if (smsError.includes('TEXTLK_API_TOKEN') || smsError.includes('not configured')) {
            setError('SMS configuration error: Please check Text.lk API token configuration');
          } else if (smsError.includes('Invalid phone number')) {
            setError('Invalid phone number format. Please use format: 0712345678 or +94712345678');
          } else {
            setError(`SMS failed: ${smsError}. Email was sent successfully.`);
          }
        }
      }

      onBillSent();
      onClose();
      
      // Show success message
      const successMessage = customerPhone 
        ? `Bill #${billNumber} sent successfully!\n\n📧 Email sent to: ${customerEmail}\n📱 SMS sent to: ${customerPhone}`
        : `Bill #${billNumber} sent successfully to ${customerEmail}!`;
      
      showSuccessAlert(successMessage);
      
      // Reset form
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setBillNumber('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send Bill</h2>
            <p className="text-sm text-gray-600">Order #{order.id} - Table {order.tableNumber}</p>
            {billNumber && (
              <p className="text-xs text-blue-600 font-medium">Bill #: {billNumber}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.foodItem.name} ({item.portion.name}) × {item.quantity}
                </span>
                <span className="font-medium">Rs. {item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>Rs. {order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Customer Information</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name {order.customer ? '(Pre-filled)' : '(Optional)'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer name"
                />
              </div>
            </div>

            {/* Customer Email */}
            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
                {order.customer?.email && <span className="text-green-600 text-xs ml-1">(Pre-filled)</span>}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  id="customerEmail"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Customer Phone */}
            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number {order.customer ? '(Pre-filled)' : '(Optional)'}
                <span className="text-blue-600 text-xs ml-1">📱 SMS will be sent if provided</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number (e.g., 0712345678)"
                />
              </div>
              {customerPhone && (
                <p className="text-xs text-gray-500 mt-1">
                  Format: 0712345678 or +94712345678 (SMS will be sent via Text.lk)
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !customerEmail}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center backdrop-blur-sm"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Bill
                  {customerPhone && <MessageSquare className="w-4 h-4 ml-1" />}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
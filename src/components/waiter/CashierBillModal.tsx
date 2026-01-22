"use client";

import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { X, User, Phone, Mail, CreditCard, DollarSign } from 'lucide-react';
import { showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';

interface CashierBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: number;
    tableNumber: number | null;
    totalAmount: number;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    customerId: string | null;
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
  onBillCompleted: () => void;
}

interface PaymentData {
  receivedAmount: number;
  balance: number;
  paymentMode: 'CASH' | 'CARD';
  referenceNumber?: string;
}

interface FormValues {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMode: 'CASH' | 'CARD';
  receivedAmount: number;
  referenceNumber: string;
}

export default function CashierBillModal({ isOpen, onClose, order, onBillCompleted }: CashierBillModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<any>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  useEffect(() => {
    if (isOpen && order.customer) {
      setExistingCustomer(order.customer);
    } else {
      setExistingCustomer(null);
    }
  }, [isOpen, order.customer]);

  const handlePhoneChange = async (phone: string, setFieldValue: (field: string, value: any) => void) => {
    if (phone.length >= 10) {
      setIsSearchingCustomer(true);
      try {
        const response = await fetch(`/api/customers/search?phone=${phone}`);
        if (response.ok) {
          const customer = await response.json();
          if (customer) {
            setExistingCustomer(customer);
            setFieldValue('customerName', customer.name);
            setFieldValue('customerEmail', customer.email || '');
            setFieldValue('customerPhone', customer.phone);
          } else {
            setExistingCustomer(null);
          }
        }
      } catch (error) {
        console.error('Error searching customer:', error);
      } finally {
        setIsSearchingCustomer(false);
      }
    } else {
      setExistingCustomer(null);
    }
  };

  const validateForm = (values: FormValues) => {
    const errors: any = {};

    if (!values.customerPhone) {
      errors.customerPhone = 'Phone number is required';
    } else if (!/^[0-9]{10,}$/.test(values.customerPhone.replace(/\s/g, ''))) {
      errors.customerPhone = 'Please enter a valid phone number (minimum 10 digits)';
    }

    if (!values.customerName) {
      errors.customerName = 'Customer name is required';
    } else if (values.customerName.trim().length < 2) {
      errors.customerName = 'Name must be at least 2 characters long';
    }

    if (values.customerEmail && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address';
    }

    if (!values.receivedAmount || values.receivedAmount < order.totalAmount) {
      errors.receivedAmount = `Amount received must be at least Rs. ${order.totalAmount.toFixed(2)}`;
    }

    if (values.paymentMode === 'CARD' && !values.referenceNumber?.trim()) {
      errors.referenceNumber = 'Reference number is required for card payments';
    }

    return errors;
  };

  const handleSubmit = async (values: FormValues) => {
    setIsProcessing(true);
    try {
      // First, ensure customer exists or create one
      let customerId = order.customerId;
      if (!customerId) {
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const customerResponse = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: values.customerName,
              email: values.customerEmail || null,
              phone: values.customerPhone,
            }),
          });
          if (customerResponse.ok) {
            const newCustomer = await customerResponse.json();
            customerId = newCustomer.id;
          }
        }
      }

      // Generate bill number
      const now = new Date();
      const dateStr = now.getFullYear().toString() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') + 
                     now.getDate().toString().padStart(2, '0');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const billNumber = `BILL-${dateStr}-${randomNum}`;

      // Create payment record
      const paymentData: PaymentData = {
        receivedAmount: values.receivedAmount,
        balance: Math.max(0, values.receivedAmount - order.totalAmount),
        paymentMode: values.paymentMode,
        referenceNumber: values.paymentMode === 'CARD' ? values.referenceNumber : undefined,
      };

      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      // Create payment
      const paymentResponse = await fetch('/api/cashier/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          customerId: customerId,
          amount: order.totalAmount,
          receivedAmount: paymentData.receivedAmount,
          balance: paymentData.balance,
          paymentMode: paymentData.paymentMode,
          referenceNumber: paymentData.referenceNumber,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }

      // Update order with customer info and bill number, mark as COMPLETED
      const orderResponse = await fetch(`/api/orders/${order.id}/bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: values.customerName,
          customerEmail: values.customerEmail || null,
          customerPhone: values.customerPhone,
          billNumber,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to complete bill');
      }

      const result = await orderResponse.json();

      // Show success message
      const paymentModeText = paymentData.paymentMode === 'CASH' ? 'Cash' : 'Card';
      const balanceText = paymentData.balance > 0 ? ` (Balance: Rs. ${paymentData.balance.toFixed(2)})` : '';
      const refText = paymentData.referenceNumber ? ` (Ref: ${paymentData.referenceNumber})` : '';
      
      showSuccessAlert(`Bill completed successfully! Bill #${billNumber}. Payment: ${paymentModeText}${refText}${balanceText}`);
      
      onBillCompleted();
      onClose();
    } catch (error: any) {
      showErrorAlert(`Failed to complete bill: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const initialValues: FormValues = {
    customerName: order.customerName || order.customer?.name || '',
    customerEmail: order.customerEmail || order.customer?.email || '',
    customerPhone: order.customerPhone || order.customer?.phone || '',
    paymentMode: 'CASH',
    receivedAmount: order.totalAmount,
    referenceNumber: '',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Process Payment & Send Bill</h2>
            <p className="text-sm text-gray-600">Order #{order.id} {order.tableNumber ? `- Table ${order.tableNumber}` : ''}</p>
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
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>Rs. {order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <Formik
          initialValues={initialValues}
          validate={validateForm}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, setFieldValue, handleChange, handleBlur, isValid, dirty }) => (
            <Form className="p-6">
              {/* Customer Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                
                {/* Phone Number */}
                <div className="mb-4">
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Field
                      type="tel"
                      id="customerPhone"
                      name="customerPhone"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.customerPhone && touched.customerPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleChange(e);
                        handlePhoneChange(e.target.value, setFieldValue);
                      }}
                      onBlur={handleBlur}
                    />
                    {isSearchingCustomer && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  <ErrorMessage name="customerPhone" component="div" className="text-red-500 text-sm mt-1" />
                  {existingCustomer && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Existing customer found: {existingCustomer.name}
                    </p>
                  )}
                </div>

                {/* Customer Name */}
                <div className="mb-4">
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Field
                      type="text"
                      id="customerName"
                      name="customerName"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.customerName && touched.customerName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <ErrorMessage name="customerName" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Field
                      type="email"
                      id="customerEmail"
                      name="customerEmail"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.customerEmail && touched.customerEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  <ErrorMessage name="customerEmail" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>

              {/* Payment Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
                
                {/* Payment Mode */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFieldValue('paymentMode', 'CASH')}
                      className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                        values.paymentMode === 'CASH'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                      <span className="font-medium">Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFieldValue('paymentMode', 'CARD')}
                      className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                        values.paymentMode === 'CARD'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="font-medium">Card</span>
                    </button>
                  </div>
                </div>

                {/* Amount Received */}
                <div className="mb-4">
                  <label htmlFor="receivedAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Received <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Field
                      type="number"
                      id="receivedAmount"
                      name="receivedAmount"
                      min={order.totalAmount}
                      step="0.01"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.receivedAmount && touched.receivedAmount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter amount received"
                    />
                  </div>
                  <ErrorMessage name="receivedAmount" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Reference Number - Only show for CARD payment */}
                {values.paymentMode === 'CARD' && (
                  <div className="mb-4">
                    <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Field
                        type="text"
                        id="referenceNumber"
                        name="referenceNumber"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.referenceNumber && touched.referenceNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter card reference number"
                      />
                    </div>
                    <ErrorMessage name="referenceNumber" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                )}

                {/* Balance */}
                {values.receivedAmount > order.totalAmount && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balance to Return
                    </label>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <span className="text-lg font-semibold text-green-700">
                        Rs. {(values.receivedAmount - order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !isValid || !dirty}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Complete Bill & Send'
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

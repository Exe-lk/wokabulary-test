"use client";

import { useState, useEffect } from 'react';
import { X, Clock, User, MapPin, CreditCard } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialRequests: string | null;
  foodItem: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  portion: {
    id: string;
    name: string;
  };
}

interface Order {
  id: number | string;
  tableNumber: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED' | 'COMPLETED';
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    name: string;
    email: string;
  };
  orderItems: OrderItem[];
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
  payments?: {
    id: string;
    paymentMode: string;
    receivedAmount: number;
    balance: number;
  }[];
}

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export default function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  const [serviceChargeRate, setServiceChargeRate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/settings');
        if (response.ok) {
          const settings = await response.json();
          setServiceChargeRate(settings.serviceChargeRate || 0);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && order) {
      fetchSettings();
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PREPARING':
        return 'bg-orange-100 text-orange-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'SERVED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PREPARING':
        return 'Preparing';
      case 'READY':
        return 'Ready';
      case 'SERVED':
        return 'Served';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const subtotal = order.totalAmount;
  const serviceCharge = subtotal * (serviceChargeRate / 100);
  const total = subtotal + serviceCharge;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600">{order.tableNumber ? `Table ${order.tableNumber} - ` : ''}Order #{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Order Information */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {order.tableNumber && (
                    <>
                      <span className="font-medium">Table:</span> {order.tableNumber}
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Created:</span> {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Served by:</span> {order.staff.name}
                </span>
              </div>
              {order.customer && (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">Customer:</span> {order.customer.name} ({order.customer.phone})
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium">Last Updated:</span> {formatDate(order.updatedAt)} at {formatTime(order.updatedAt)}
              </div>
              {order.payments && order.payments.length > 0 && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Payment:</span> {order.payments[0].paymentMode} - Rs. {order.payments[0].receivedAmount.toFixed(2)}
                  {order.payments[0].balance > 0 && (
                    <span className="text-green-600 ml-1">(Balance: Rs. {order.payments[0].balance.toFixed(2)})</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Notes:</span> {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                {item.foodItem.imageUrl && (
                  <img
                    src={item.foodItem.imageUrl}
                    alt={item.foodItem.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.foodItem.name}</h4>
                      <p className="text-sm text-gray-600">{item.portion.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.specialRequests && (
                        <p className="text-sm text-blue-600 mt-1">
                          <span className="font-medium">Special:</span> {item.specialRequests}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        Rs. {item.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Rs. {item.unitPrice.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bill Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
              </div>
              {serviceChargeRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Service Charge ({serviceChargeRate}%):</span>
                  <span className="font-medium">Rs. {serviceCharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-300">
                <span>Total:</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useState, useEffect } from 'react';
import { showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';
import CashierBillModal from './CashierBillModal';
import OrderDetailModal from './OrderDetailModal';

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
  id: number;
  tableNumber: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED' | 'COMPLETED';
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerId: string | null;
  staff: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  orderItems: OrderItem[];
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  payments?: Array<{
    id: string;
    paymentMode: string;
    receivedAmount: number;
    balance: number;
    referenceNumber: string | null;
  }>;
}

interface AdminOrdersListProps {
  userRole: string;
}

export default function AdminOrdersList({ userRole }: AdminOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [billModal, setBillModal] = useState<{
    isOpen: boolean;
    order: Order | null;
  }>({
    isOpen: false,
    order: null,
  });

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    order: Order | null;
  }>({
    isOpen: false,
    order: null,
  });

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/orders?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter orders - show SERVED orders for cashiers to process bills
  const filteredOrders = orders.filter(order => {
    if (statusFilter === '') {
      // For "All Orders" tab, show SERVED orders (unpaid bills) for cashiers
      if (userRole === 'CASHIER' || userRole === 'admin' || userRole === 'MANAGER') {
        return order.status === 'SERVED';
      }
      // For others, exclude completed and cancelled
      return order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
    }
    return order.status === statusFilter;
  });

  const handleProcessBill = (order: Order) => {
    setBillModal({
      isOpen: true,
      order,
    });
  };

  const handleCloseBillModal = () => {
    setBillModal({
      isOpen: false,
      order: null,
    });
  };

  const handleBillCompleted = () => {
    fetchOrders(); // Refresh orders
  };

  const handleViewDetails = (order: Order) => {
    setDetailModal({
      isOpen: true,
      order,
    });
  };

  const handleCloseDetailModal = () => {
    setDetailModal({
      isOpen: false,
      order: null,
    });
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'SERVED':
        return 'bg-purple-100 text-purple-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
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
      case 'PREPARING':
        return 'Preparing';
      case 'READY':
        return 'Ready';
      case 'SERVED':
        return 'Served - Awaiting Payment';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Orders</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {(userRole === 'CASHIER' || userRole === 'admin' || userRole === 'MANAGER') ? 'Unpaid Bills' : 'All Orders'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {(userRole === 'CASHIER' || userRole === 'admin') 
            ? 'Process payments and send bills for served orders'
            : 'View and manage all orders'}
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="flex items-center justify-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                statusFilter === '' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {(userRole === 'CASHIER' || userRole === 'admin' || userRole === 'MANAGER') ? 'Unpaid Bills' : 'Active Orders'}
            </button>
            <button
              onClick={() => setStatusFilter('SERVED')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'SERVED' 
                  ? 'bg-purple-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Served ({orders.filter(o => o.status === 'SERVED').length})
            </button>
            <button
              onClick={() => setStatusFilter('READY')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'READY' 
                  ? 'bg-green-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ready ({orders.filter(o => o.status === 'READY').length})
            </button>
            <button
              onClick={() => setStatusFilter('PREPARING')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'PREPARING' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Preparing ({orders.filter(o => o.status === 'PREPARING').length})
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-center">
          <div>
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">
              {statusFilter 
                ? `No ${statusFilter.toLowerCase()} orders at the moment.`
                : (userRole === 'CASHIER' || userRole === 'admin' || userRole === 'MANAGER')
                  ? "No unpaid bills at the moment."
                  : "No active orders found."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Order Header - Clickable */}
              <div 
                className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleViewDetails(order)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Order #{order.id}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <div className="flex items-center space-x-4">
                    {order.tableNumber && <span>Table {order.tableNumber}</span>}
                    {order.tableNumber && <span>•</span>}
                    <span>{formatTime(order.createdAt)}</span>
                    <span>•</span>
                    <span>Waiter: {order.staff.name}</span>
                    {order.customer && (
                      <>
                        <span>•</span>
                        <span>{order.customer.name}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    Rs. {order.totalAmount.toFixed(2)}
                  </span>
                  <span className="text-xs text-blue-600">
                    Click to view details
                  </span>
                </div>
                {order.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Notes:</span> {order.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {item.foodItem.imageUrl && (
                          <img
                            src={item.foodItem.imageUrl}
                            alt={item.foodItem.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.foodItem.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.portion.name} × {item.quantity}
                          </p>
                          {item.specialRequests && (
                            <p className="text-xs text-blue-600 mt-1">
                              Special: {item.specialRequests}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Rs. {item.totalPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Rs. {item.unitPrice.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  {/* Mark as Served Button - For READY orders */}
                  {(userRole === 'CASHIER' || userRole === 'admin' || userRole === 'MANAGER') && order.status === 'READY' && (
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/waiter/orders/${order.id}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'SERVED' }),
                          });
                          if (response.ok) {
                            showSuccessAlert('Order marked as served successfully!');
                            fetchOrders();
                          } else {
                            const errorData = await response.json();
                            showErrorAlert(errorData.error || 'Failed to mark order as served');
                          }
                        } catch (err: any) {
                          showErrorAlert(err.message || 'Failed to mark order as served');
                        }
                      }}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark as Served
                    </button>
                  )}

                  {/* Process Payment Button - For SERVED orders */}
                  {(userRole === 'CASHIER' || userRole === 'admin' || userRole === 'MANAGER') && order.status === 'SERVED' && (
                    <button
                      onClick={() => handleProcessBill(order)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Process Payment & Send Bill
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cashier Bill Modal */}
      {billModal.order && (
        <CashierBillModal
          isOpen={billModal.isOpen}
          onClose={handleCloseBillModal}
          order={billModal.order}
          onBillCompleted={handleBillCompleted}
        />
      )}

      {/* Order Detail Modal */}
      {detailModal.order && (
        <OrderDetailModal
          isOpen={detailModal.isOpen}
          onClose={handleCloseDetailModal}
          order={detailModal.order}
        />
      )}
    </div>
  );
}

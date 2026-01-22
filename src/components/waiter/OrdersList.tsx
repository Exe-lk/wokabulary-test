"use client";

import { useState, useEffect } from 'react';
import { showSuccessAlert } from '@/lib/sweetalert';
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
  id: string;
  tableNumber: number;
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
    email?: string;
  };
}

interface OrdersListProps {
  staffId: string;
}

export default function OrdersList({ staffId }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [servingOrderId, setServingOrderId] = useState<string | null>(null);

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
      const response = await fetch(`/api/waiter/orders?staffId=${staffId}`);
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

  // Filter orders based on status filter, excluding completed and cancelled orders from "All Orders"
  const filteredOrders = orders.filter(order => {
    if (statusFilter === '') {
      // For "All Orders" tab, exclude completed and cancelled orders
      return order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
    }
    // For specific status filters, show only orders with that status
    return order.status === statusFilter;
  });

  const handleServeOrder = async (orderId: string) => {
    try {
      setServingOrderId(orderId);
      const response = await fetch(`/api/waiter/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'SERVED' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to serve order');
      }

      // Update the order in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: 'SERVED' } : order
        )
      );
      showSuccessAlert('Order marked as served successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setServingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    // Import Swal dynamically for complex dialog with textarea
    const Swal = (await import('sweetalert2')).default;
    
    const result = await Swal.fire({
      title: 'Cancel Order?',
      text: `Are you sure you want to cancel Order #${orderNumber}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Cancel Order',
      cancelButtonText: 'Keep Order',
      input: 'textarea',
      inputPlaceholder: 'Optional: Enter reason for cancellation...',
      inputAttributes: {
        'aria-label': 'Reason for cancellation'
      }
    });

    if (result.isConfirmed) {
      try {
        setServingOrderId(orderId); // Reuse the loading state
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: result.value || 'Cancelled by waiter' }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to cancel order');
        }

        // Update the order in the local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'CANCELLED' } : order
          )
        );
        showSuccessAlert('Order cancelled successfully!');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setServingOrderId(null);
      }
    }
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
    if (staffId) {
      fetchOrders();
    }
  }, [staffId, statusFilter]);

  const clearFilter = () => {
    setStatusFilter('');
  };

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
        return 'Served';
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
        <h2 className="text-xl font-semibold text-gray-900">My Active Orders</h2>
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
              Active Orders
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'PENDING' 
                  ? 'bg-yellow-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({orders.filter(o => o.status === 'PENDING').length})
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
              onClick={() => setStatusFilter('CANCELLED')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'CANCELLED' 
                  ? 'bg-red-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cancelled ({orders.filter(o => o.status === 'CANCELLED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Filter Indicator */}
      {statusFilter && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Filtered: {filteredOrders.length} {statusFilter === 'PENDING' ? 'pending' : 
                         statusFilter === 'PREPARING' ? 'preparing' : 
                         statusFilter === 'READY' ? 'ready' : 
                         statusFilter === 'SERVED' ? 'served' : 
                         statusFilter === 'CANCELLED' ? 'cancelled' : ''} orders
              </span>
            </div>
            <button
              onClick={clearFilter}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Show Active
            </button>
          </div>
        </div>
      )}

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
                ? `No ${statusFilter.toLowerCase().replace('_', ' ')} orders at the moment.`
                : "No active orders found. All orders are completed."
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
                    <span>Table {order.tableNumber}</span>
                    <span>•</span>
                    <span>{formatTime(order.createdAt)}</span>
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

              {/* Action Buttons - Only show for non-completed orders */}
              {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    {/* Serve Order Button - Only for READY orders */}
                    {order.status === 'READY' && (
                      <button
                        onClick={() => handleServeOrder(order.id)}
                        disabled={servingOrderId === order.id}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {servingOrderId === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Serving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Serve Order
                          </>
                        )}
                      </button>
                    )}

                    {/* Cancel Order Button - Only for PREPARING orders */}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleCancelOrder(order.id, order.id)}
                        disabled={servingOrderId === order.id}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {servingOrderId === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Order
                          </>
                        )}
                      </button>
                    )}

                    {/* Show Bill Button - Only for SERVED orders (view only, no sending) */}
                    {order.status === 'SERVED' && (
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Bill
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
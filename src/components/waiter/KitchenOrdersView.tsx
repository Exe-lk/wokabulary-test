"use client";

import { useState, useEffect } from "react";
import { showErrorAlert } from '@/lib/sweetalert';

interface OrderItemIngredient {
  id: string;
  quantity: number;
  ingredient: {
    id: string;
    name: string;
    unitOfMeasurement: string;
  };
}

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
    category: {
      id: string;
      name: string;
    };
  };
  portion: {
    id: string;
    name: string;
  };
  ingredients: OrderItemIngredient[];
}

interface Order {
  id: number;
  tableNumber: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  orderItems: OrderItem[];
}

export default function KitchenOrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/kitchen/orders?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: 'PREPARING' | 'READY') => {
    setUpdatingOrderId(orderId);
    setUpdatingAction(newStatus);
    try {
      const response = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      await fetchOrders();
    } catch (err: any) {
      console.error('Error updating status:', err);
      showErrorAlert('Error', err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
      setUpdatingAction(null);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    const Swal = (await import('sweetalert2')).default;

    const result = await Swal.fire({
      title: 'Cancel Order?',
      text: `Cancel Order #${orderId}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No',
      input: 'text',
      inputPlaceholder: 'Reason (optional)',
    });

    if (result.isConfirmed) {
      setUpdatingOrderId(orderId);
      setUpdatingAction('CANCEL');
      try {
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: result.value || 'Cancelled by admin' }),
        });

        if (!response.ok) {
          throw new Error('Failed to cancel order');
        }

        await fetchOrders();
      } catch (err: any) {
        console.error('Error cancelling order:', err);
      } finally {
        setUpdatingOrderId(null);
        setUpdatingAction(null);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'PREPARING':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'READY':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;

    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Kitchen Orders...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    // Filter by status
    const statusMatch = !statusFilter || order.status === statusFilter;

    // Filter by search term
    const searchMatch = !searchTerm ||
      order.id.toString().includes(searchTerm.toLowerCase()) ||
      order.tableNumber.toString().includes(searchTerm.toLowerCase()) ||
      order.staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderItems.some(item =>
        item.foodItem.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return statusMatch && searchMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');
  const readyOrders = orders.filter(o => o.status === 'READY');

  return (
    <div className="min-h-[400px]">
      {/* Search Bar and Refresh */}
      <div className="bg-white border-b mb-6">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by order ID, table, staff, or food item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchOrders}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white border-b mb-6">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${statusFilter === ''
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${statusFilter === 'PENDING'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Pending ({pendingOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('PREPARING')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${statusFilter === 'PREPARING'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Preparing ({preparingOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('READY')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${statusFilter === 'READY'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Ready ({readyOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {filteredOrders.length === 0
            ? 'No orders found'
            : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredOrders.length)} of ${filteredOrders.length} orders`
          }
          {searchTerm && (
            <span className="ml-2">
              for "<span className="font-medium">{searchTerm}</span>"
            </span>
          )}
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length > 0 ? (
        <>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedOrders.map((order) => (
                <div key={order.id} className={`bg-white rounded-xl shadow-sm border-2 ${getStatusColor(order.status)} p-6`}>
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">#{order.id}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Table {order.tableNumber}</h3>
                        <p className="text-sm text-gray-500">{order.staff.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(order.createdAt)}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.orderItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.foodItem.name}</p>
                            <p className="text-xs text-gray-500">{item.portion.name}</p>
                            {item.specialRequests && (
                              <p className="text-xs text-orange-600 mt-1">⚠️ {item.specialRequests}</p>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 ml-2">×{item.quantity}</span>
                        </div>

                        {/* Ingredients */}
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-700 mb-1">Ingredients:</p>
                            <div className="space-y-1">
                              {item.ingredients.map((ingredient) => (
                                <div key={ingredient.id} className="flex justify-between text-xs">
                                  <span className="text-gray-600">{ingredient.ingredient.name}</span>
                                  <span className="text-gray-800 font-medium">
                                    {ingredient.quantity} {ingredient.ingredient.unitOfMeasurement}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {order.orderItems.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">+{order.orderItems.length - 3} more items</p>
                    )}
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-medium text-blue-900 mb-1">📝 Order Notes:</p>
                      <p className="text-sm text-blue-800">{order.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                        disabled={updatingOrderId === order.id && updatingAction === 'PREPARING'}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        {updatingOrderId === order.id && updatingAction === 'PREPARING' ? 'Starting...' : 'Start Preparing'}
                      </button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'READY')}
                        disabled={updatingOrderId === order.id && updatingAction === 'READY'}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        {updatingOrderId === order.id && updatingAction === 'READY' ? 'Updating...' : 'Ready to Serve'}
                      </button>
                    )}
                    {(order.status === 'PENDING' || order.status === 'PREPARING') && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={updatingOrderId === order.id && updatingAction === 'CANCEL'}
                        className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 lg:px-8 mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500">
              {searchTerm
                ? `No orders found matching "${searchTerm}"`
                : 'No orders available at the moment'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

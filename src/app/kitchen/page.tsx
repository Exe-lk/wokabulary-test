"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showSuccessAlert, showConfirmDialog } from '@/lib/sweetalert';
import Swal from "sweetalert2";

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
}

interface Order {
  id: number;
  tableNumber: number;
  status: 'PENDING' | 'PREPARING' | 'READY';
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
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Ingredient {
  id: string;
  name: string;
  currentStockQuantity: number;
  reorderLevel: number;
  unitOfMeasurement: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function KitchenDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'orders' | 'ingredients'>('orders');

  useEffect(() => {
    // Check if staff is logged in
    const storedUser = sessionStorage.getItem('staff_user');
    if (!storedUser) {
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== 'KITCHEN') {
        router.push("/");
        return;
      }
      setStaffUser(user);
    } catch (error) {
      console.error('Error parsing staff data:', error);
      router.push("/");
      return;
    }

    fetchOrders();
    fetchIngredients();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchOrders();
      fetchIngredients();
    }, 30000);
    return () => clearInterval(interval);
  }, [router, statusFilter]);

  // Debug: Monitor ingredients state changes
  useEffect(() => {
    console.log('Ingredients state changed:', ingredients);
  }, [ingredients]);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/admin/ingredients');
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not ok:', errorText);
        throw new Error(`Failed to fetch ingredients: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Setting ingredients state:', data);
      setIngredients(data);
    } catch (err: any) {
      console.error('Error fetching ingredients:', err);
      setError(`Failed to load ingredients: ${err.message}`);
    }
  };

  const clearFilter = () => {
    setStatusFilter('');
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'PREPARING' | 'READY') => {
    setUpdatingOrderId(orderId);
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

      // Refresh orders after successful update
      await fetchOrders();
      showSuccessAlert('Order status updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
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
      setUpdatingOrderId(orderId);
      try {
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: result.value || 'Cancelled from kitchen' }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to cancel order');
        }

        // Refresh orders after successful cancellation
        await fetchOrders();
        showSuccessAlert('Order cancelled successfully!');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setUpdatingOrderId(null);
      }
    }
  };

  const handleLogout = async () => {
    const result = await showConfirmDialog(
      'Are you sure?',
      'You will be logged out and redirected to the login page.',
      'Yes, logout',
      'Cancel'
    );
    
    if (result.isConfirmed) {
      sessionStorage.removeItem('staff_user');
      sessionStorage.removeItem('staff_session');
      router.push("/");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-orange-500 text-orange-800';
      case 'PREPARING':
        return 'border-blue-500 text-blue-800';
      case 'READY':
        return 'border-green-500 text-green-800';
      default:
        return 'border-gray-300 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'PREPARING':
        return '👨‍🍳';
      case 'READY':
        return '✅';
      default:
        return '📋';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return 'PREPARING';
      case 'PREPARING':
        return 'READY';
      default:
        return null;
    }
  };

  const getNextStatusButtonText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return 'Start Cooking';
      case 'PREPARING':
        return 'Mark Ready';
      default:
        return '';
    }
  };

  const getStockStatus = (currentStockQuantity: number, reorderLevel: number) => {
    if (currentStockQuantity <= 0) return { status: 'out', color: 'red', icon: '❌' };
    if (currentStockQuantity <= reorderLevel) return { status: 'low', color: 'orange', icon: '⚠️' };
    return { status: 'good', color: 'green', icon: '✅' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Kitchen Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-blue-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left side - Dashboard title and stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
                  <p className="text-sm text-gray-600">Your cooking command center</p>
                </div>
              </div>
              {activeTab === 'orders' && (
                <div className="flex space-x-3">
                  <div className="bg-orange-100 px-3 py-1 rounded-full">
                    <span className="text-orange-800 text-sm font-medium">
                      ⏳ Pending: {orders.filter(o => o.status === 'PENDING').length}
                    </span>
                  </div>
                  <div className="bg-blue-100 px-3 py-1 rounded-full">
                    <span className="text-blue-800 text-sm font-medium">
                      👨‍🍳 Cooking: {orders.filter(o => o.status === 'PREPARING').length}
                    </span>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-green-800 text-sm font-medium">
                      ✅ Ready: {orders.filter(o => o.status === 'READY').length}
                    </span>
                  </div>
                </div>
              )}
              {activeTab === 'ingredients' && (
                <div className="flex space-x-3">
                  <div className="bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-gray-800 text-sm font-medium">
                      📊 Total: {ingredients.length}
                    </span>
                  </div>
                  <div className="bg-red-100 px-3 py-1 rounded-full">
                    <span className="text-red-800 text-sm font-medium">
                      ❌ Out of Stock: {ingredients.filter(i => i.currentStockQuantity <= 0).length}
                    </span>
                  </div>
                  <div className="bg-orange-100 px-3 py-1 rounded-full">
                    <span className="text-orange-800 text-sm font-medium">
                      ⚠️ Low Stock: {ingredients.filter(i => i.currentStockQuantity > 0 && i.currentStockQuantity <= i.reorderLevel).length}
                    </span>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-green-800 text-sm font-medium">
                      ✅ Good Stock: {ingredients.filter(i => i.currentStockQuantity > i.reorderLevel).length}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Center - Welcome message */}
            {/* <div className="flex-1 flex justify-center">
              <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg">
                <h2 className="text-lg font-semibold">
                  Welcome back, <span className="text-yellow-200">{staffUser?.name}</span>! 👨‍🍳
                </h2>
                <p className="text-blue-100 text-sm">Ready to create culinary magic?</p>
              </div>
            </div> */}

            {/* Right side - Refresh and Logout buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  fetchOrders();
                  fetchIngredients();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <div className="bg-gray-100 rounded-xl p-2 shadow-inner">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'orders' 
                    ? 'bg-white text-gray-900 shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📋 Orders
              </button>
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'ingredients' 
                    ? 'bg-white text-gray-900 shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🥘 Ingredients
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'orders' ? (
          <OrdersTab 
            orders={orders}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            clearFilter={clearFilter}
            error={error}
            updatingOrderId={updatingOrderId}
            handleStatusUpdate={handleStatusUpdate}
            handleCancelOrder={handleCancelOrder}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            formatTime={formatTime}
            getNextStatus={getNextStatus}
            getNextStatusButtonText={getNextStatusButtonText}
          />
        ) : (
          <IngredientsTab 
            ingredients={ingredients}
            getStockStatus={getStockStatus}
          />
        )}
      </main>
    </div>
  );
}

// Orders Tab Component
function OrdersTab({ 
  orders, 
  statusFilter, 
  setStatusFilter, 
  clearFilter, 
  error, 
  updatingOrderId, 
  handleStatusUpdate,
  handleCancelOrder,
  getStatusColor,
  getStatusIcon,
  formatTime,
  getNextStatus,
  getNextStatusButtonText
}: {
  orders: Order[];
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  clearFilter: () => void;
  error: string;
  updatingOrderId: string | null;
  handleStatusUpdate: (orderId: string, newStatus: 'PREPARING' | 'READY') => void;
  handleCancelOrder: (orderId: string, orderNumber: string) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => string;
  formatTime: (dateString: string) => string;
  getNextStatus: (currentStatus: string) => string | null;
  getNextStatusButtonText: (currentStatus: string) => string;
}) {
  return (
    <>
      {/* Filter Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="bg-gray-100 rounded-xl p-2 shadow-inner">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === '' 
                    ? 'bg-white text-gray-900 shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📋 All Orders
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === 'PENDING' 
                    ? 'bg-orange-500 text-white shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                ⏳ Pending ({orders.filter(o => o.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setStatusFilter('PREPARING')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === 'PREPARING' 
                    ? 'bg-blue-500 text-white shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                👨‍🍳 Cooking ({orders.filter(o => o.status === 'PREPARING').length})
              </button>
              <button
                onClick={() => setStatusFilter('READY')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === 'READY' 
                    ? 'bg-green-500 text-white shadow-md transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                ✅ Ready ({orders.filter(o => o.status === 'READY').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Indicator */}
      {statusFilter && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-blue-900">
                  Filtered: {orders.length} {statusFilter === 'PENDING' ? 'pending' : 
                           statusFilter === 'PREPARING' ? 'cooking' : 
                           statusFilter === 'READY' ? 'ready' : ''} orders
                </span>
                <p className="text-xs text-blue-700">Showing filtered results</p>
              </div>
            </div>
            <button
              onClick={clearFilter}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-white px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              Show All
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
            <div className="text-8xl mb-6">🍽️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">All Caught Up!</h3>
            <p className="text-gray-600 mb-6">No pending orders at the moment. Time for a coffee break! ☕</p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💡 Orders will appear here automatically when customers place them
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {/* Order Header */}
              <div className={`px-6 py-4 border-b border-gray-100 ${
                order.status === 'PENDING' ? 'bg-gradient-to-r from-orange-50 to-red-50' :
                order.status === 'PREPARING' ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
                'bg-gradient-to-r from-green-50 to-emerald-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Order #{order.id}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Table {order.tableNumber}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(order.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Waiter: {order.staff.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor(order.status)}`}>
                      <span className="mr-2">{getStatusIcon(order.status)}</span>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <div className="space-y-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="bg-blue-600 text-white text-lg font-bold px-3 py-1 rounded-full">
                              {item.quantity}x
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900 text-lg">
                                {item.foodItem.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.portion.name} • Rs. {item.unitPrice.toFixed(2)} each
                              </p>
                              {item.specialRequests && (
                                <div className="mt-2 p-2 bg-yellow-100 rounded-lg border border-yellow-200">
                                  <p className="text-sm text-yellow-800 flex items-center">
                                    <span className="mr-2">💬</span>
                                    <span className="font-medium">Special Request:</span> {item.specialRequests}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-lg">
                            Rs. {item.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Notes */}
                {order.notes && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-600 text-lg">📝</span>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Order Notes:</p>
                        <p className="text-sm text-yellow-700 mt-1">{order.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center bg-blue-50 rounded-lg p-4">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-xl font-bold text-blue-600">
                      Rs. {order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 space-y-3">
                {getNextStatus(order.status) && (
                    <button
                      onClick={() => handleStatusUpdate(order.id.toString(), getNextStatus(order.status) as 'PREPARING' | 'READY')}
                      disabled={updatingOrderId === order.id.toString()}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                        order.status === 'PENDING'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 disabled:from-orange-300 disabled:to-red-300'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 disabled:from-blue-300 disabled:to-indigo-300'
                      }`}
                    >
                      {updatingOrderId === order.id.toString() ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Updating...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>{getNextStatusButtonText(order.status)}</span>
                          {order.status === 'PENDING' ? '🔥' : '✅'}
                        </div>
                      )}
                    </button>
                  )}
                  
                  {/* Cancel Button - Only show for PREPARING orders */}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleCancelOrder(order.id.toString(), order.id.toString())}
                      disabled={updatingOrderId === order.id.toString()}
                      className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400"
                    >
                      {updatingOrderId === order.id.toString() ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Cancelling...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>Cancel Order</span>
                          <span>❌</span>
                  </div>
                      )}
                    </button>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Ingredients Tab Component
function IngredientsTab({ 
  ingredients, 
  getStockStatus 
}: {
  ingredients: Ingredient[];
  getStockStatus: (currentStock: number, reorderLevel: number) => { status: string; color: string; icon: string };
}) {
  return (
    <>
      <div className="mb-6">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ingredient Inventory</h2>
              <p className="text-sm text-gray-600">Monitor stock levels and manage ingredients</p>
            </div>
          </div>
        </div>
      </div>

      {ingredients.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
            <div className="text-8xl mb-6">🥘</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Ingredients Found</h3>
            <p className="text-gray-600 mb-6">No ingredients have been added to the system yet.</p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💡 Ingredients will appear here once they are added by the admin
              </p>
            </div>

          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ingredients.map((ingredient) => {
            const stockStatus = getStockStatus(ingredient.currentStockQuantity, ingredient.reorderLevel);
            return (
              <div
                key={ingredient.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {/* Ingredient Header */}
                <div className={`px-4 py-3 border-b border-gray-100 ${
                  stockStatus.status === 'out' ? 'bg-gradient-to-r from-red-50 to-pink-50' :
                  stockStatus.status === 'low' ? 'bg-gradient-to-r from-orange-50 to-yellow-50' :
                  'bg-gradient-to-r from-green-50 to-emerald-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {ingredient.name}
                      </h3>
                      {ingredient.description && (
                        <p className="text-sm text-gray-600">
                          {ingredient.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                        stockStatus.status === 'out' ? 'border-red-300 text-red-800 bg-red-100' :
                        stockStatus.status === 'low' ? 'border-orange-300 text-orange-800 bg-orange-100' :
                        'border-green-300 text-green-800 bg-green-100'
                      }`}>
                        <span className="mr-1">{stockStatus.icon}</span>
                        {stockStatus.status === 'out' ? 'Out of Stock' :
                         stockStatus.status === 'low' ? 'Low Stock' : 'Good Stock'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ingredient Details */}
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Current Stock */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Current Stock:</span>
                      <span className={`font-bold text-lg ${
                        stockStatus.status === 'out' ? 'text-red-600' :
                        stockStatus.status === 'low' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {ingredient.currentStockQuantity} {ingredient.unitOfMeasurement}
                      </span>
                    </div>

                    {/* Reorder Level */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Reorder Level:</span>
                      <span className="font-semibold text-gray-900">
                        {ingredient.reorderLevel} {ingredient.unitOfMeasurement}
                      </span>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Stock vs Reorder Level</span>
                        <span>
                          {ingredient.currentStockQuantity === 0 ? '0%' : 
                           ingredient.currentStockQuantity <= ingredient.reorderLevel ? 
                           `${Math.round((ingredient.currentStockQuantity / ingredient.reorderLevel) * 100)}%` :
                           '100%+'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            stockStatus.status === 'out' ? 'bg-red-500' :
                            stockStatus.status === 'low' ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ 
                            width: `${ingredient.currentStockQuantity === 0 ? 0 : 
                                   ingredient.currentStockQuantity <= ingredient.reorderLevel ? 
                                   Math.min((ingredient.currentStockQuantity / ingredient.reorderLevel) * 100, 100) : 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 text-center">
                        Last updated: {new Date(ingredient.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

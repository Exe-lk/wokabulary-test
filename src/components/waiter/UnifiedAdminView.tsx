"use client";

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { clearOrder } from '@/redux/slices/orderSlice';
import { showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';
import TableNumberInput from './TableNumberInput';
import CategoryTabs from './CategoryTabs';
import FoodItemCard from './FoodItemCard';
import OrderCart from './OrderCart';
import CustomerDetailsModal from './CustomerDetailsModal';
import CashierBillModal from './CashierBillModal';
import OrderDetailModal from './OrderDetailModal';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface FoodItemPortion {
  id: string;
  portionId: string;
  price: number;
  portion: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  foodItemPortions: FoodItemPortion[];
}

interface CategoryData {
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  items: FoodItem[];
}

interface CategorizedItems {
  [categoryName: string]: CategoryData;
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

interface UnifiedAdminViewProps {
  adminUser: AdminUser;
}

export default function UnifiedAdminView({ adminUser }: UnifiedAdminViewProps) {
  const dispatch = useAppDispatch();
  const orderState = useAppSelector((state) => state.order);
  
  // Place order state
  const [categorizedItems, setCategorizedItems] = useState<CategorizedItems>({});
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Orders management state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [billModal, setBillModal] = useState<{ isOpen: boolean; order: Order | null }>({ isOpen: false, order: null });
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; order: Order | null }>({ isOpen: false, order: null });

  // Fetch food items
  useEffect(() => {
    fetchFoodItems();
  }, []);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchFoodItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await fetch('/api/waiter/food-items');
      if (!response.ok) {
        throw new Error('Failed to fetch food items');
      }
      const data = await response.json();
      setCategorizedItems(data);
      const categories = Object.keys(data);
      if (categories.length > 0) {
        setActiveCategory(categories[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      // Fetch all orders, we'll filter on client side
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      showErrorAlert('Failed to fetch orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Filter orders based on status filter
  const filteredOrders = statusFilter 
    ? orders.filter(order => order.status === statusFilter)
    : orders.filter(order => order.status !== 'COMPLETED' && order.status !== 'CANCELLED');

  const handlePlaceOrderClick = () => {
    if (!orderState.tableNumber || orderState.items.length === 0) {
      return;
    }
    setShowCustomerModal(true);
  };

  const handleCustomerModalConfirm = async (customerData: any, paymentData: any, waiterId?: string) => {
    if (!orderState.tableNumber || orderState.items.length === 0) {
      return;
    }

    if (!waiterId) {
      showErrorAlert('Please select a waiter for this order');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        tableNumber: orderState.tableNumber,
        staffId: waiterId,
        items: orderState.items.map(item => ({
          foodItemId: item.foodItemId,
          portionId: item.portionId,
          quantity: item.quantity,
          specialRequests: item.specialRequests
        })),
        notes: orderState.notes,
        customerData: null,
        paymentData: null
      };

      const response = await fetch('/api/waiter/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const newOrder = await response.json();
      showSuccessAlert(`Order placed successfully for Table ${orderState.tableNumber}! Order #${newOrder.id}`);
      dispatch(clearOrder());
      setShowCustomerModal(false);
      fetchOrders();
    } catch (error: any) {
      showErrorAlert(`Failed to place order: ${error.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED') => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }

      await fetchOrders();
      showSuccessAlert(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleProcessBill = (order: Order) => {
    setBillModal({ isOpen: true, order });
  };

  const handleBillCompleted = () => {
    fetchOrders();
    setBillModal({ isOpen: false, order: null });
  };

  const handleViewDetails = (order: Order) => {
    setDetailModal({ isOpen: true, order });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'PREPARING': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'READY': return 'bg-green-100 text-green-800 border-green-300';
      case 'SERVED': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const categories = Object.keys(categorizedItems);
  const currentCategoryData = categorizedItems[activeCategory];

  return (
    <div className="h-full flex">
      {/* Left Side - Place Order */}
      <div className="w-1/2 flex flex-col bg-gray-50 border-r border-gray-200">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Place New Order</h2>
        </div>
        
        <TableNumberInput />
        
        {categories.length > 0 && (
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingItems ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : currentCategoryData && currentCategoryData.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentCategoryData.items.map((item) => (
                <FoodItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No items available in this category</p>
            </div>
          )}
        </div>

        <div className="border-t bg-white p-4">
          <OrderCart />
          {orderState.tableNumber && orderState.items.length > 0 && (
            <button
              onClick={handlePlaceOrderClick}
              disabled={isPlacingOrder}
              className="w-full mt-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
          )}
        </div>
      </div>

      {/* Right Side - Orders Management */}
      <div className="w-1/2 flex flex-col bg-white">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
            <button
              onClick={fetchOrders}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === 'PENDING' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Pending ({orders.filter(o => o.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setStatusFilter('PREPARING')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === 'PREPARING' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Preparing ({orders.filter(o => o.status === 'PREPARING').length})
            </button>
            <button
              onClick={() => setStatusFilter('READY')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === 'READY' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Ready ({orders.filter(o => o.status === 'READY').length})
            </button>
            <button
              onClick={() => setStatusFilter('SERVED')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === 'SERVED' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Served ({orders.filter(o => o.status === 'SERVED').length})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === 'COMPLETED' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Completed ({orders.filter(o => o.status === 'COMPLETED').length})
            </button>
            <button
              onClick={() => setStatusFilter('CANCELLED')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Cancelled ({orders.filter(o => o.status === 'CANCELLED').length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingOrders ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">Order #{order.id}</span>
                        {order.tableNumber && (
                          <span className="text-sm text-gray-600">Table {order.tableNumber}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Waiter: {order.staff.name}</p>
                      <p className="text-xs text-gray-400">{formatTime(order.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
                    <div className="space-y-1">
                      {order.orderItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="text-sm text-gray-600">
                          {item.foodItem.name} ({item.portion.name}) × {item.quantity} - Rs. {item.totalPrice.toFixed(2)}
                        </div>
                      ))}
                      {order.orderItems.length > 3 && (
                        <p className="text-xs text-gray-500">+{order.orderItems.length - 3} more items</p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-2">Total: Rs. {order.totalAmount.toFixed(2)}</p>
                  </div>

                  {/* Status Change Buttons */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {order.status !== 'PENDING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'PENDING')}
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md text-xs font-medium hover:bg-yellow-200 disabled:opacity-50"
                      >
                        Set Pending
                      </button>
                    )}
                    {order.status !== 'PREPARING' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200 disabled:opacity-50"
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status !== 'READY' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'READY')}
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 disabled:opacity-50"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status !== 'SERVED' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'SERVED')}
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-xs font-medium hover:bg-purple-200 disabled:opacity-50"
                      >
                        Mark Served
                      </button>
                    )}
                    {order.status === 'SERVED' && (
                      <button
                        onClick={() => handleProcessBill(order)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700"
                      >
                        Process Payment
                      </button>
                    )}
                    {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                    {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CustomerDetailsModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onConfirm={handleCustomerModalConfirm}
        totalAmount={orderState.totalAmount}
        isProcessing={isPlacingOrder}
        showWaiterSelection={true}
      />

      {billModal.order && (
        <CashierBillModal
          isOpen={billModal.isOpen}
          onClose={() => setBillModal({ isOpen: false, order: null })}
          order={billModal.order}
          onBillCompleted={handleBillCompleted}
        />
      )}

      {detailModal.order && (
        <OrderDetailModal
          isOpen={detailModal.isOpen}
          onClose={() => setDetailModal({ isOpen: false, order: null })}
          order={detailModal.order}
        />
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { clearOrder, completeOrder } from '@/redux/slices/orderSlice';
import { showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';
import TableNumberInput from '@/components/waiter/TableNumberInput';
import CategoryTabs from '@/components/waiter/CategoryTabs';
import FoodItemCard from '@/components/waiter/FoodItemCard';
import OrderCart from '@/components/waiter/OrderCart';
import OrdersList from '@/components/waiter/OrdersList';
import AdminOrdersList from '@/components/waiter/AdminOrdersList';
import CustomerDetailsModal from '@/components/waiter/CustomerDetailsModal';
import QuickBillModal from '@/components/waiter/QuickBillModal';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  isNewCustomer: boolean;
  customerId?: string;
}

interface PaymentData {
  receivedAmount: number;
  balance: number;
  paymentMode: 'CASH' | 'CARD';
  referenceNumber?: string;
}

export default function WaiterOrdersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const orderState = useAppSelector((state) => state.order);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Waiter functionality state
  const [categorizedItems, setCategorizedItems] = useState<CategorizedItems>({});
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<'place-order' | 'my-orders'>('place-order');

  // Customer details modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Quick bill modal state
  const [showQuickBillModal, setShowQuickBillModal] = useState(false);
  const [isCreatingQuickBill, setIsCreatingQuickBill] = useState(false);

  useEffect(() => {
    // Check if admin is logged in
    const storedAdmin = localStorage.getItem('adminUser');
    if (!storedAdmin) {
      router.push('/admin/login');
      return;
    }

    try {
      const admin = JSON.parse(storedAdmin);
      setAdminUser(admin);
    } catch (error) {
      console.error('Error parsing admin data:', error);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fetch food items when component mounts
  useEffect(() => {
    if (adminUser && Object.keys(categorizedItems).length === 0) {
      fetchFoodItems();
    }
  }, [adminUser]);

  const fetchFoodItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await fetch('/api/waiter/food-items');
      if (!response.ok) {
        throw new Error('Failed to fetch food items');
      }
      const data = await response.json();
      setCategorizedItems(data);

      // Set first category as active
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

  const handlePlaceOrderClick = () => {
    if (!orderState.tableNumber || orderState.items.length === 0 || !adminUser) {
      return;
    }
    
    // If admin or cashier, place order directly without customer details/payment
    if (adminUser.role === 'CASHIER' || adminUser.role === 'admin' || adminUser.role === 'MANAGER') {
      handlePlaceOrderDirectly();
    } else {
      // For waiters, show customer details modal
    setShowCustomerModal(true);
    }
  };

  const handleCustomerModalConfirm = async (customerData: CustomerData | null, paymentData: PaymentData | null, waiterId?: string) => {
    if (!orderState.tableNumber || orderState.items.length === 0 || !adminUser) {
      return;
    }

    // If admin/cashier is placing order, they only need waiter selection (no customer/payment)
    if ((adminUser.role === 'CASHIER' || adminUser.role === 'admin')) {
      if (!waiterId) {
      showErrorAlert('Please select a waiter for this order');
        return;
      }
      // Place order without customer/payment data
      await handlePlaceOrderDirectly(waiterId);
      return;
    }

    // For waiters, require customer and payment data
    if (!customerData || !paymentData) {
      showErrorAlert('Customer details and payment information are required');
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Use waiterId if provided (for admin/cashier), otherwise use adminUser.id
      const finalStaffId = waiterId || adminUser.id;

      const orderData = {
        tableNumber: orderState.tableNumber,
        staffId: finalStaffId,
        items: orderState.items.map(item => ({
          foodItemId: item.foodItemId,
          portionId: item.portionId,
          quantity: item.quantity,
          specialRequests: item.specialRequests
        })),
        notes: orderState.notes,
        customerData,
        paymentData
      };

      const response = await fetch('/api/waiter/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const newOrder = await response.json();

      // Show success message and clear order
      const paymentModeText = paymentData.paymentMode === 'CASH' ? 'Cash' : 'Card';
      const balanceText = paymentData.balance > 0 ? ` (Balance: Rs. ${paymentData.balance.toFixed(2)})` : '';
      showSuccessAlert(`Order placed successfully for Table ${orderState.tableNumber}! Order #${newOrder.id}. Payment: ${paymentModeText}${balanceText}`);
      dispatch(clearOrder());
      setShowCustomerModal(false);

    } catch (error: any) {
      showErrorAlert(`Failed to place order: ${error.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCustomerModalClose = () => {
    setShowCustomerModal(false);
  };

  const handlePlaceOrderDirectly = async (waiterId?: string) => {
    if (!orderState.tableNumber || orderState.items.length === 0 || !adminUser) {
      return;
    }

    // If admin/cashier is placing order, they must select a waiter
    if ((adminUser.role === 'CASHIER' || adminUser.role === 'admin') && !waiterId) {
      // Show waiter selection modal
      setShowCustomerModal(true);
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Use waiterId if provided (for admin/cashier), otherwise use adminUser.id
      const finalStaffId = waiterId || adminUser.id;

      const orderData = {
        tableNumber: orderState.tableNumber,
        staffId: finalStaffId,
        items: orderState.items.map(item => ({
          foodItemId: item.foodItemId,
          portionId: item.portionId,
          quantity: item.quantity,
          specialRequests: item.specialRequests
        })),
        notes: orderState.notes,
        // No customerData or paymentData for admin/cashier - will be collected later
        customerData: null,
        paymentData: null
      };

      const response = await fetch('/api/waiter/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const newOrder = await response.json();

      // Show success message and clear order
      showSuccessAlert(`Order placed successfully for Table ${orderState.tableNumber}! Order #${newOrder.id}. Customer details and payment will be collected when order is served.`);
      dispatch(clearOrder());
      setShowCustomerModal(false);

    } catch (error: any) {
      showErrorAlert(`Failed to place order: ${error.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleQuickBillConfirm = async (orderData: any) => {
    if (!adminUser) {
      return;
    }

    setIsCreatingQuickBill(true);
    try {
      const response = await fetch('/api/cashier/quick-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId: adminUser.id,
          items: orderData.items,
          notes: orderData.notes,
          customerData: orderData.customerData,
          paymentData: orderData.paymentData,
          orderType: orderData.orderType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quick bill');
      }

      const newOrder = await response.json();

      // Build success message with payment details
      const paymentModeText = orderData.paymentData.paymentMode === 'CASH' ? 'Cash' : 'Card';
      const balanceText = orderData.paymentData.balance > 0 ? ` (Balance: Rs. ${orderData.paymentData.balance.toFixed(2)})` : '';
      const refText = orderData.paymentData.referenceNumber ? ` (Ref: ${orderData.paymentData.referenceNumber})` : '';
      
      let successMessage = `Quick bill created successfully! Bill #${newOrder.billNumber}. Payment: ${paymentModeText}${refText}${balanceText}`;
      
      // Add email and SMS status to success message
      const emailStatus = newOrder.emailResult;
      const smsStatus = newOrder.smsResult;
      
      if (emailStatus || smsStatus) {
        successMessage += '\n\n';
        const statusParts = [];
        
        if (emailStatus) {
          if (emailStatus.success) {
            statusParts.push(`📧 Email sent to: ${orderData.customerData.email}`);
          } else {
            statusParts.push(`📧 Email failed: ${emailStatus.error || 'Unknown error'}`);
          }
        }
        
        if (smsStatus) {
          if (smsStatus.success) {
            statusParts.push(`📱 SMS sent to: ${orderData.customerData.phone}`);
          } else {
            statusParts.push(`📱 SMS failed: ${smsStatus.error || 'Unknown error'}`);
          }
        }
        
        successMessage += statusParts.join('\n');
      }
      
      showSuccessAlert(successMessage);
      
      setShowQuickBillModal(false);
      
      // Optionally redirect to bill page
      if (newOrder.id) {
        window.open(`/bill/${newOrder.id}`, '_blank');
      }

    } catch (error: any) {
      showErrorAlert(`Failed to create quick bill: ${error.message}`);
    } finally {
      setIsCreatingQuickBill(false);
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Waiter Orders...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // Will redirect to login
  }

  // Place Order Tab Content
  const PlaceOrderContent = () => {
    if (isLoadingItems) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu items...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load menu</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchFoodItems}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    const categories = Object.keys(categorizedItems);
    const currentCategoryData = categorizedItems[activeCategory];

    return (
      <div className="h-full flex">
        {/* Left Side - Menu */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Table Number Input */}
          <TableNumberInput />

          {/* Category Tabs */}
          {categories.length > 0 && (
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          )}

          {/* Food Items Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {currentCategoryData && currentCategoryData.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentCategoryData.items.map((item) => (
                  <FoodItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No items available</h3>
                  <p className="text-gray-500">This category doesn't have any items yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Order Cart */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <OrderCart />

          {/* Place Order Button */}
          {orderState.tableNumber && orderState.items.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handlePlaceOrderClick}
                disabled={isPlacingOrder}
                className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isPlacingOrder ? 'Placing Order...' : `Place Order - Rs. ${orderState.totalAmount.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
              <p className="text-sm text-gray-500 mt-1">Place new orders and view order history</p>
            </div>
            <div className="flex items-center space-x-4">
              {adminUser && (adminUser.role === 'CASHIER' || adminUser.role === 'admin') && (
                <button
                  onClick={() => setShowQuickBillModal(true)}
                  className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  title="Quick Bill"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              )}
              <button
                onClick={fetchFoodItems}
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
      <div className="bg-white border-b border-gray-200 px-6 py-4 mt-4">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('place-order')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'place-order'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Place Order
          </button>
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'my-orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Ongoing Orders
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'place-order' && <PlaceOrderContent />}
        {activeTab === 'my-orders' && adminUser && (
          (adminUser.role === 'CASHIER' || adminUser.role === 'admin') ? (
            <AdminOrdersList userRole={adminUser.role} />
          ) : (
            <OrdersList staffId={adminUser.id} />
          )
        )}
      </div>

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={showCustomerModal}
        onClose={handleCustomerModalClose}
        onConfirm={handleCustomerModalConfirm}
        totalAmount={orderState.totalAmount}
        isProcessing={isPlacingOrder}
        showWaiterSelection={adminUser && (adminUser.role === 'CASHIER' || adminUser.role === 'admin')}
      />

      {/* Quick Bill Modal */}
      {adminUser && (adminUser.role === 'CASHIER' || adminUser.role === 'admin') && (
        <QuickBillModal
          isOpen={showQuickBillModal}
          onClose={() => setShowQuickBillModal(false)}
          onConfirm={handleQuickBillConfirm}
          categorizedItems={categorizedItems}
          isProcessing={isCreatingQuickBill}
        />
      )}
    </div>
  );
} 
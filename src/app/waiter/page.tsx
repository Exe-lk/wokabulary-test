"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { clearOrder, completeOrder } from '@/redux/slices/orderSlice';
import { showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';
import TableNumberInput from '@/components/waiter/TableNumberInput';
import CategoryTabs from '@/components/waiter/CategoryTabs';
import FoodItemCard from '@/components/waiter/FoodItemCard';
import OrderCart from '@/components/waiter/OrderCart';
import OrdersList from '@/components/waiter/OrdersList';

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

export default function WaiterDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const orderState = useAppSelector((state) => state.order);
  
  const [categorizedItems, setCategorizedItems] = useState<CategorizedItems>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [staffUser, setStaffUser] = useState<any>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<'place-order' | 'my-orders'>('place-order');

  // Check authentication
  useEffect(() => {
    const storedUser = sessionStorage.getItem('staff_user');
    if (!storedUser) {
      router.push("/");
      return;
    }
    try {
      const user = JSON.parse(storedUser);
      if (user.role !== 'WAITER') {
        router.push("/");
        return;
      }
      setStaffUser(user);
    } catch (error) {
      router.push("/");
    }
  }, [router]);

  // Fetch food items
  useEffect(() => {
    const fetchFoodItems = async () => {
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
        setIsLoading(false);
      }
    };

    if (staffUser) {
      fetchFoodItems();
    }
  }, [staffUser]);

  const handleLogout = () => {
    sessionStorage.removeItem('staff_user');
    sessionStorage.removeItem('staff_session');
    router.push("/");
  };

  const handlePlaceOrder = async () => {
    if (!orderState.tableNumber || orderState.items.length === 0 || !staffUser) {
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        tableNumber: orderState.tableNumber,
        staffId: staffUser.id,
        items: orderState.items.map(item => ({
          foodItemId: item.foodItemId,
          portionId: item.portionId,
          quantity: item.quantity,
          specialRequests: item.specialRequests
        })),
        notes: orderState.notes
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
      showSuccessAlert(`Order placed successfully for Table ${orderState.tableNumber}! Order #${newOrder.id}`);
      dispatch(clearOrder());
      
    } catch (error: any) {
      showErrorAlert(`Failed to place order: ${error.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading menu items...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Waiter Dashboard...</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Menu</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const categories = Object.keys(categorizedItems);
  const currentCategoryItems = categorizedItems[activeCategory]?.items || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Waiter Dashboard</h1>
              {staffUser && (
                <span className="ml-4 text-sm text-gray-600">Welcome, {staffUser.name}</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('place-order')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'place-order'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Place Order</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my-orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'my-orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>My Orders</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'place-order' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Side - Menu Items */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
              {currentCategoryItems.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-center">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items available</h3>
                    <p className="text-gray-600">This category doesn't have any items yet.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {currentCategoryItems.map((item) => (
                    <FoodItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Order Cart */}
          <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
            <OrderCart />
            
            {/* Place Order Button */}
            {orderState.items.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isPlacingOrder ? 'Placing Order...' : `Place Order - Rs. ${orderState.totalAmount.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {staffUser && <OrdersList staffId={staffUser.id} />}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import AddFoodItemModal from "@/components/AddFoodItemModal";
import EditFoodItemModal from "@/components/EditFoodItemModal";
import { FaCheckCircle, FaTimesCircle, FaEdit, FaTrash } from "react-icons/fa";
import { showErrorAlert } from "@/lib/sweetalert";

interface FoodItemPortionIngredient {
  id: string;
  ingredientId: string;
  quantity: number;
  ingredient: {
    id: string;
    name: string;
    unitOfMeasurement: string;
  };
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
  ingredients: FoodItemPortionIngredient[];
}

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  foodItemPortions: FoodItemPortion[];
}

export default function ManageItems() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  const fetchFoodItems = async () => {
    try {
      const response = await fetch('/api/admin/food-items');
      if (!response.ok) {
        throw new Error('Failed to fetch food items');
      }
      const data = await response.json();
      setItems(data);
      setFilteredItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, []);

  // Filter items based on search term
  useEffect(() => {
    const filtered = items.filter(item => {
      const searchLower = searchTerm.toLowerCase();

      // Search in item name
      if (item.name.toLowerCase().includes(searchLower)) return true;

      // Search in item description
      if (item.description && item.description.toLowerCase().includes(searchLower)) return true;

      // Search in category name
      if (item.category.name.toLowerCase().includes(searchLower)) return true;

      // Search in category description
      if (item.category.description && item.category.description.toLowerCase().includes(searchLower)) return true;

      // Search in portion names
      if (item.foodItemPortions.some(portion =>
        portion.portion.name.toLowerCase().includes(searchLower) ||
        (portion.portion.description && portion.portion.description.toLowerCase().includes(searchLower))
      )) return true;

      // Search in prices (convert price to string for searching)
      if (item.foodItemPortions.some(portion =>
        portion.price.toString().includes(searchLower) ||
        formatPrice(portion.price).toLowerCase().includes(searchLower)
      )) return true;

      return false;
    });
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  const handleFoodItemAdded = () => {
    fetchFoodItems();
  };

  const handleFoodItemUpdated = () => {
    fetchFoodItems();
  };

  const handleEditItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const toggleItemStatus = async (itemId: string, newStatus: boolean) => {
    if (togglingItemId) return; // Prevent multiple clicks
    
    setTogglingItemId(itemId);
    try {
      const response = await fetch(`/api/admin/food-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemId,
          isActive: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item status');
      }

      // Update the local state
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, isActive: newStatus } : item
        )
      );

      const Swal = (await import('sweetalert2')).default;
      Swal.fire({
        title: 'Success!',
        text: `Item ${newStatus ? 'enabled' : 'disabled'} successfully`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      showErrorAlert('Failed to update item status');
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const Swal = (await import('sweetalert2')).default;
    
    const result = await Swal.fire({
      title: 'Delete Item?',
      text: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/food-items/${itemId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete item');
        }

        await Swal.fire({
          title: 'Deleted!',
          text: 'Item has been deleted successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });

        fetchFoodItems();
      } catch (err: any) {
        await Swal.fire({
          title: 'Error!',
          text: err.message || 'Failed to delete item.',
          icon: 'error',
        });
      }
    }
  };

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString('en-LK')}`;
  };


  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Food Items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Items</h1>
            <p className="text-sm text-gray-500 mt-1">Add, edit, and manage your menu items</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Items</p>
                  <p className="text-2xl font-bold text-gray-900">{items.filter(i => i.isActive).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{new Set(items.map(i => i.categoryId)).size}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Portions</p>
                  <p className="text-2xl font-bold text-gray-900">{items.reduce((sum, i) => sum + i.foodItemPortions.length, 0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar and Add Food Item Button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, category, portion, or price..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchFoodItems}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  title="Refresh"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center justify-center"
                  title="Add Food Item"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Food Items List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Food Items</h2>
                <div className="text-sm text-gray-500">
                  {filteredItems.length === 0 
                    ? 'No items found' 
                    : `Showing ${filteredItems.length} of ${items.length} items`
                  }
                  {searchTerm && (
                    <span className="ml-2">
                      for "<span className="font-medium">{searchTerm}</span>"
                    </span>
                  )}
                </div>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No food items found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? `No items match "${searchTerm}". Try adjusting your search.`
                    : "Get started by adding your first food item."
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-md hover:from-green-700 hover:to-emerald-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Your First Item
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredients</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient Weights</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        {/* Item */}
                        <td className={`px-6 py-4 whitespace-nowrap ${item.foodItemPortions.length > 1 ? 'border-r border-gray-200' : ''}`}>
                          <div className="flex items-center">
                            {item.imageUrl && (
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {!item.imageUrl && (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white font-semibold text-sm">
                                  {item.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className={`px-6 py-4 ${item.foodItemPortions.length > 1 ? 'border-r border-gray-200' : ''}`}>
                          <div className="text-sm text-gray-600 max-w-xs">
                            {item.description ? (
                              <div title={item.description}>
                                {item.description}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No description</span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className={`px-6 py-4 whitespace-nowrap ${item.foodItemPortions.length > 1 ? 'border-r border-gray-200' : ''}`}>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.category.name}
                          </span>
                        </td>

                        {/* Portion - show all portions */}
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {item.foodItemPortions.map((portion) => (
                              <div key={portion.id} className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">{portion.portion.name}</span>
                                {portion.portion.description && (
                                  <span className="ml-2 text-xs text-gray-500">({portion.portion.description})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Price - show all prices */}
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {item.foodItemPortions.map((portion) => (
                              <div key={portion.id}>
                                <span className="text-sm font-semibold text-green-600">
                                  {formatPrice(portion.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Ingredients - show all portions' ingredients */}
                        <td className="px-6 py-4">
                          <div className="space-y-3 max-w-xs">
                            {item.foodItemPortions.map((portion, portionIdx) => (
                              <div key={portion.id} className={portionIdx > 0 ? 'border-t border-gray-200 pt-2' : ''}>
                                {portion.ingredients && portion.ingredients.length > 0 ? (
                                  <div className="space-y-1">
                                    {portion.ingredients.slice(0, 3).map((ingredient) => (
                                      <div key={ingredient.id} className="text-xs">
                                        <span className="text-gray-700 font-medium">{ingredient.ingredient.name}</span>
                                      </div>
                                    ))}
                                    {portion.ingredients.length > 3 && (
                                      <div className="text-xs text-gray-400">
                                        +{portion.ingredients.length - 3} more
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">No ingredients specified</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Ingredient Weights - show all portions' weights */}
                        <td className="px-6 py-4">
                          <div className="space-y-3 max-w-xs">
                            {item.foodItemPortions.map((portion, portionIdx) => (
                              <div key={portion.id} className={portionIdx > 0 ? 'border-t border-gray-200 pt-2' : ''}>
                                {portion.ingredients && portion.ingredients.length > 0 ? (
                                  <div className="space-y-1">
                                    {portion.ingredients.slice(0, 3).map((ingredient) => (
                                      <div key={ingredient.id} className="text-xs">
                                        <span className="text-gray-600">
                                          {ingredient.quantity} {ingredient.ingredient.unitOfMeasurement}
                                        </span>
                                      </div>
                                    ))}
                                    {portion.ingredients.length > 3 && (
                                      <div className="text-xs text-gray-400">
                                        +{portion.ingredients.length - 3} more
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">-</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className={`px-6 py-4 whitespace-nowrap ${item.foodItemPortions.length > 1 ? 'border-r border-gray-200' : ''}`}>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <FaCheckCircle className={`w-3 h-3 mr-1 ${item.isActive ? 'text-green-500' : 'text-red-500'}`} />
                            {item.isActive ? 'Available' : 'Disabled'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditItem(item.id)}
                              className="inline-flex items-center justify-center p-2 text-purple-600 hover:text-purple-900 rounded-md hover:bg-purple-50 transition-colors"
                              title="Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleItemStatus(item.id, !item.isActive)}
                              disabled={togglingItemId === item.id}
                              className={`inline-flex items-center justify-center p-2 rounded-md transition-colors ${
                                togglingItemId === item.id
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : item.isActive
                                  ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                                  : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              }`}
                              title={item.isActive ? 'Disable' : 'Enable'}
                            >
                              {togglingItemId === item.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                              ) : item.isActive ? (
                                <FaTimesCircle className="w-4 h-4" />
                              ) : (
                                <FaCheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:text-red-900 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>

      <AddFoodItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onFoodItemAdded={handleFoodItemAdded}
      />

      <EditFoodItemModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        foodItem={selectedItem}
        onFoodItemUpdated={handleFoodItemUpdated}
      />
    </div>
  );
} 
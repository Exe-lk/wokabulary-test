"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddIngredientMaster from "@/components/AddIngredientMaster";
import EditIngredientMaster from "@/components/EditIngredientMaster";
import AddStockModal from "@/components/AddStockModal";
import StockOutModal from "@/components/StockOutModal";
import { showCustomAlert, showErrorAlert, showConfirmDialog } from '@/lib/sweetalert';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash } from "react-icons/fa";

interface Ingredient {
  id: string;
  name: string;
  description?: string;
  unitOfMeasurement: string;
  currentStockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ManageCategories() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [addingStockTo, setAddingStockTo] = useState<Ingredient | null>(null);
  const [stockingOutFrom, setStockingOutFrom] = useState<Ingredient | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [hasShownLowStockAlert, setHasShownLowStockAlert] = useState(false);

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
    }
  }, [router]);

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/admin/ingredients');
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }
      const data = await response.json();
      setIngredients(data);
      setFilteredIngredients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // Filter ingredients based on search term
  useEffect(() => {
    const filtered = ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ingredient.description && ingredient.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ingredient.unitOfMeasurement.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIngredients(filtered);
  }, [searchTerm, ingredients]);

  const handleAddIngredient = () => {
    setIsAddModalOpen(true);
  };

  const handleIngredientAdded = () => {
    fetchIngredients();
    // Don't reset alert flag when ingredients are updated via actions
    // The alert should only show on first page load
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
  };

  const handleAddStock = async (ingredient: Ingredient) => {
    // Show warning if ingredient is below reorder level
    if (ingredient.currentStockQuantity < ingredient.reorderLevel && ingredient.isActive) {
      const result = await showCustomAlert({
        title: 'Low Stock Warning',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>${ingredient.name}</strong> is currently below its reorder level.</p>
            <p class="text-sm text-gray-600">Current: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}</p>
            <p class="text-sm text-gray-600">Reorder Level: ${ingredient.reorderLevel} ${ingredient.unitOfMeasurement}</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continue Adding Stock',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        setAddingStockTo(ingredient);
      }
    } else {
      setAddingStockTo(ingredient);
    }
  };

  const handleStockOut = async (ingredient: Ingredient) => {
    // Check if ingredient has stock to stock out
    if (ingredient.currentStockQuantity <= 0) {
      showCustomAlert({
        title: 'No Stock Available',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>${ingredient.name}</strong> has no stock available to stock out.</p>
            <p class="text-sm text-gray-600">Current Stock: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}</p>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Show warning if ingredient is already below reorder level
    if (ingredient.currentStockQuantity < ingredient.reorderLevel && ingredient.isActive) {
      const result = await showCustomAlert({
        title: 'Low Stock Warning',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>${ingredient.name}</strong> is currently below its reorder level.</p>
            <p class="text-sm text-gray-600">Current: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}</p>
            <p class="text-sm text-gray-600">Reorder Level: ${ingredient.reorderLevel} ${ingredient.unitOfMeasurement}</p>
            <p class="text-sm text-red-600 font-medium">Stocking out will make this ingredient even more critical.</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continue Stock Out',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        setStockingOutFrom(ingredient);
      }
    } else {
      setStockingOutFrom(ingredient);
    }
  };


  const handleDeleteIngredient = async (ingredientId: string) => {
    const ingredient = ingredients.find(c => c.id === ingredientId);
    if (!ingredient) return;

    // Check if ingredient is below reorder level and show special warning
    if (ingredient.currentStockQuantity < ingredient.reorderLevel && ingredient.isActive) {
      const result = await Swal.fire({
        title: 'Delete Low Stock Ingredient?',
        html: `
          <div class="text-center">
            <p class="mb-2"><strong>${ingredient.name}</strong> is currently below its reorder level.</p>
            <p class="text-sm text-gray-600 mb-3">Current: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}    Reorder Level: ${ingredient.reorderLevel} ${ingredient.unitOfMeasurement}</p>
            <p class="text-red-600 font-medium">Are you sure you want to delete this ingredient?</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        background: '#fef2f2',
        customClass: {
          popup: 'rounded-lg',
          title: 'text-red-800 font-semibold',
          htmlContainer: 'text-red-700'
        }
      });

      if (!result.isConfirmed) {
        return;
      }
    } else {
      // Regular confirmation for normal ingredients
      const result = await showConfirmDialog(
        'Delete Ingredient?',
        `Are you sure you want to delete "${ingredient.name}"? This action cannot be undone.`,
        'Yes, Delete',
        'Cancel'
      );

      if (!result.isConfirmed) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/ingredients/${ingredientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Show detailed error message for constraint violations
        if (errorData.affectedItems) {
          showCustomAlert({
            title: 'Cannot Delete Ingredient',
            html: `
              <div class="text-left">
                <p class="mb-2">Cannot delete ingredient <strong>"${ingredient.name}"</strong>.</p>
                <p class="text-sm text-gray-600 mb-2">Affected items: ${errorData.affectedItems.join(', ')}</p>
                <p class="text-sm text-gray-600">${errorData.error}</p>
              </div>
            `,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } else {
          showErrorAlert('Error', errorData.error || 'Failed to delete ingredient');
        }

        throw new Error(errorData.error || 'Failed to delete ingredient');
      }

      // Remove from local state
      setIngredients(prevIngredients =>
        prevIngredients.filter(ing => ing.id !== ingredientId)
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Check for low stock alerts
  const getLowStockIngredients = () => {
    return ingredients.filter(ingredient =>
      ingredient.isActive &&
      ingredient.currentStockQuantity < ingredient.reorderLevel
    );
  };

  const lowStockIngredients = getLowStockIngredients();

  // Show alert for low stock items when data is first loaded (only once per session)
  useEffect(() => {
    if (!isLoading && !hasShownLowStockAlert && lowStockIngredients.length > 0) {
      const ingredientList = lowStockIngredients.map(ing =>
        `<li><strong>${ing.name}</strong>: ${ing.currentStockQuantity} ${ing.unitOfMeasurement} (Reorder level: ${ing.reorderLevel} ${ing.unitOfMeasurement})</li>`
      ).join('');

      showCustomAlert({
        title: 'Low Stock Alert!',
        html: `
          <div class="text-left">
            <p class="mb-3">${lowStockIngredients.length} ingredient${lowStockIngredients.length > 1 ? 's' : ''} need${lowStockIngredients.length > 1 ? '' : 's'} to be reordered:</p>
            <ul class="list-disc list-inside space-y-1 text-sm">
              ${ingredientList}
            </ul>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'OK'
      });

      // Mark that we've shown the alert so it doesn't show again
      setHasShownLowStockAlert(true);
    }
  }, [isLoading, hasShownLowStockAlert, lowStockIngredients]);

  // Reset the alert flag if there are no more low stock items (for next time items go low)
  useEffect(() => {
    if (!isLoading && hasShownLowStockAlert && lowStockIngredients.length === 0) {
      setHasShownLowStockAlert(false);
    }
  }, [isLoading, hasShownLowStockAlert, lowStockIngredients.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Ingredients...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div>
            <h1 className="text-2xl font-bold text-gray-900">Ingredient Master</h1>
              <p className="text-sm text-gray-500 mt-1">Add, edit, and manage your food ingredients and stock</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Ingredients</p>
                <p className="text-2xl font-semibold text-gray-900">{ingredients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {ingredients.filter(ing => ing.isActive && ing.currentStockQuantity > ing.reorderLevel).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {ingredients.filter(ing => ing.isActive && ing.currentStockQuantity < ing.reorderLevel).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar and Add Ingredient Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search ingredients by name, description, or unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchIngredients}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={handleAddIngredient}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center justify-center"
                title="Add Ingredient"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Low Stock Alert */}
        {lowStockIngredients.length > 0 && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  Low Stock Alert ({lowStockIngredients.length} ingredient{lowStockIngredients.length > 1 ? 's' : ''})
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <ul className="list-disc list-inside space-y-1">
                    {lowStockIngredients.map((ingredient) => (
                      <li key={ingredient.id}>
                        <strong>{ingredient.name}</strong>: {ingredient.currentStockQuantity} {ingredient.unitOfMeasurement}
                        (Reorder level: {ingredient.reorderLevel} {ingredient.unitOfMeasurement})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Ingredients Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingredient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit of Measurement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIngredients.map((ingredient) => (
                  <tr key={ingredient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ingredient.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {ingredient.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ingredient.unitOfMeasurement}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium flex items-center ${ingredient.currentStockQuantity < ingredient.reorderLevel && ingredient.isActive
                        ? 'text-red-600'
                        : ingredient.currentStockQuantity <= ingredient.reorderLevel * 1.2 && ingredient.isActive
                          ? 'text-orange-600'
                          : 'text-gray-900'
                        }`}>
                        {ingredient.currentStockQuantity < ingredient.reorderLevel && ingredient.isActive && (
                          <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {ingredient.currentStockQuantity <= ingredient.reorderLevel * 1.2 && ingredient.currentStockQuantity > ingredient.reorderLevel && ingredient.isActive && (
                          <svg className="w-4 h-4 mr-1 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="font-semibold">
                          {ingredient.currentStockQuantity !== undefined && ingredient.currentStockQuantity !== null
                            ? ingredient.currentStockQuantity
                            : 0
                          }
                        </span>
                        <span className="ml-1 text-gray-600">
                          {ingredient.unitOfMeasurement}
                        </span>
                      </div>
                      {/* Stock Level Progress Bar */}
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2 relative group">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${ingredient.currentStockQuantity < ingredient.reorderLevel
                            ? 'bg-red-500'
                            : ingredient.currentStockQuantity <= ingredient.reorderLevel * 1.2
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                            }`}
                          style={{
                            width: `${Math.min(100, (ingredient.currentStockQuantity / Math.max(ingredient.reorderLevel * 2, 1)) * 100)}%`
                          }}
                        ></div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          {ingredient.currentStockQuantity} / {ingredient.reorderLevel * 2} {ingredient.unitOfMeasurement}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="font-semibold">
                          {ingredient.reorderLevel !== undefined && ingredient.reorderLevel !== null
                            ? ingredient.reorderLevel
                            : 0
                          }
                        </span>
                        <span className="ml-1 text-gray-600">
                          {ingredient.unitOfMeasurement}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAddStock(ingredient)}
                          className="inline-flex items-center justify-center p-2 border border-transparent rounded-md text-green-600 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          title="Add Stock"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleStockOut(ingredient)}
                          className={`inline-flex items-center justify-center p-2 border border-transparent rounded-md transition-colors
    ${ingredient.currentStockQuantity <= 0
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                            }`}
                          disabled={ingredient.currentStockQuantity <= 0}
                          title={
                            ingredient.currentStockQuantity <= 0
                              ? 'No stock available to stock out'
                              : 'Stock Out'
                          }
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleEditIngredient(ingredient)}
                          className="inline-flex items-center justify-center p-2 text-purple-600 hover:text-purple-900 rounded-md hover:bg-purple-50 transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteIngredient(ingredient.id)}
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
        </div>
      </div>

      {/* Add Ingredient Modal */}
      {isAddModalOpen && (
        <AddIngredientMaster
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onIngredientAdded={handleIngredientAdded}
        />
      )}

      {/* Edit Ingredient Modal */}
      {editingIngredient && (
        <EditIngredientMaster
          isOpen={!!editingIngredient}
          onClose={() => setEditingIngredient(null)}
          onIngredientUpdated={handleIngredientAdded}
          ingredient={editingIngredient!}
        />
      )}

      {/* Add Stock Modal */}
      {addingStockTo && (
        <AddStockModal
          isOpen={!!addingStockTo}
          onClose={() => setAddingStockTo(null)}
          onStockAdded={handleIngredientAdded}
          ingredient={addingStockTo!}
        />
      )}

      {/* Stock Out Modal */}
      {stockingOutFrom && (
        <StockOutModal
          isOpen={!!stockingOutFrom}
          onClose={() => setStockingOutFrom(null)}
          onStockOut={handleIngredientAdded}
          ingredient={stockingOutFrom!}
        />
      )}
    </div>
  );
} 
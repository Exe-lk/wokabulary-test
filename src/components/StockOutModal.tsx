"use client";

import { useState } from "react";
import { showCustomAlert, showErrorAlert, showConfirmDialog, showLoadingAlert } from '@/lib/sweetalert';

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

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockOut: () => void;
  ingredient: Ingredient;
}

export default function StockOutModal({ isOpen, onClose, onStockOut, ingredient }: StockOutModalProps) {
  const [quantity, setQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError("Please enter a valid quantity greater than 0");
      return;
    }

    if (quantityNum > ingredient.currentStockQuantity) {
      setError(
        `Cannot stock out more than available. Current stock: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}`
      );
      return;
    }

    // Show confirmation dialog
    const result = await showConfirmDialog(
      "Confirm Stock Out",
      `Are you sure you want to stock out ${quantityNum} ${ingredient.unitOfMeasurement} of ${ingredient.name}? This action will reduce the current stock from ${ingredient.currentStockQuantity} to ${ingredient.currentStockQuantity - quantityNum} ${ingredient.unitOfMeasurement}. This action cannot be undone.`,
      "Yes, Stock Out",
      "Cancel"
    );

    if (!result.isConfirmed) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/ingredients/${ingredient.id}/stock-out`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: quantityNum,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process stock out");
      }

      // ✅ Show success message
      showCustomAlert({
        title: "Stock Out Successful",
        html: `
        <div class="text-left">
          <p class="mb-2">Successfully stocked out <strong>${quantityNum} ${ingredient.unitOfMeasurement}</strong> of <strong>${ingredient.name}</strong>.</p>
          <p class="text-sm text-gray-600">Remaining stock: ${ingredient.currentStockQuantity - quantityNum
          } ${ingredient.unitOfMeasurement}</p>
        </div>
      `,
        icon: "success",
        confirmButtonText: "OK",
      });

      setQuantity("");
      onStockOut();
      onClose();
    } catch (err: any) {
      setError(err.message);
      showErrorAlert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleClose = () => {
    setQuantity("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Stock Out</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{ingredient.name}</h4>
            <div className="text-sm text-gray-600">
              <p>Current Stock: <span className="font-semibold">{ingredient.currentStockQuantity} {ingredient.unitOfMeasurement}</span></p>
              <p>Reorder Level: <span className="font-semibold">{ingredient.reorderLevel} {ingredient.unitOfMeasurement}</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity to Stock Out
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="quantity"
                  step="0.01"
                  min="0.01"
                  max={ingredient.currentStockQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                      setQuantity(value);
                    }
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={`Enter quantity (max: ${ingredient.currentStockQuantity}) ${ingredient.unitOfMeasurement}`}
                  required
                />
              </div>
            </div>

            {/*  <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Stock Out
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select a reason</option>
                <option value="Expired">Expired</option>
                <option value="Damaged">Damaged</option>
                <option value="Spoiled">Spoiled</option>
                <option value="Wasted">Wasted</option>
                <option value="Theft">Theft</option>
                <option value="Quality Control">Quality Control</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {reason === "Other" && (
              <div className="mb-4">
                <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Specify Reason
                </label>
                <input
                  type="text"
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter custom reason"
                  required={reason === "Other"}
                />
              </div>
            )} */}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-md hover:from-orange-600 hover:to-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  "Stock Out"
                )}
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

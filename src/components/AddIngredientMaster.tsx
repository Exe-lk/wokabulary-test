"use client";

import { useState } from "react";
import { showSuccessAlert } from '@/lib/sweetalert';

interface AddIngredientMasterProps {
  isOpen: boolean;
  onClose: () => void;
  onIngredientAdded: () => void;
}

export default function AddIngredientMaster({ isOpen, onClose, onIngredientAdded }: AddIngredientMasterProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitOfMeasurement, setUnitOfMeasurement] = useState("");
  const [currentStockQuantity, setCurrentStockQuantity] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/admin/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          description, 
          unitOfMeasurement, 
          currentStockQuantity: parseFloat(currentStockQuantity) || 0,
          reorderLevel: parseFloat(reorderLevel) || 0 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ingredient');
      }

      setName("");
      setDescription("");
      setUnitOfMeasurement("");
      setCurrentStockQuantity("");
      setReorderLevel("");
      onIngredientAdded();
      onClose();
      showSuccessAlert('Ingredient created successfully!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create ingredient');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Ingredient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Ingredient Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Rice, Chicken, Tomatoes"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description for this ingredient"
            />
          </div>

          <div>
            <label
              htmlFor="unitOfMeasurement"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Unit of Measurement *
            </label>
            <select
              id="unitOfMeasurement"
              value={unitOfMeasurement}
              onChange={(e) => setUnitOfMeasurement(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select Unit --</option>
              <option value="g">g - Gram</option>
              <option value="kg">kg - Kilogram</option>
              <option value="ml">ml - Milliliter</option>
              <option value="L">l - Liter</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="currentStockQuantity"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Stock Quantity
            </label>
            <input
              type="number"
              id="currentStockQuantity"
              value={currentStockQuantity}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d{0,2}$/.test(value)) {
                  setCurrentStockQuantity(value);
                }
              }}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 100.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Initial stock quantity when adding this ingredient
            </p>
          </div>

          <div>
            <label
              htmlFor="reorderLevel"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reorder Level
            </label>
            <input
              type="number"
              id="reorderLevel"
              value={reorderLevel}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d{0,2}$/.test(value)) {
                  setReorderLevel(value);
                }
              }}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 10.50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alert will be shown when current stock falls below this level
            </p>
          </div>


          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-md hover:from-blue-700 hover:to-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                "Add Ingredient"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
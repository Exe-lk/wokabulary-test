"use client";

import { useState, useEffect } from "react";
import { showSuccessAlert } from '@/lib/sweetalert';

interface Portion {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditPortionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPortionUpdated: () => void;
  portion: Portion | null;
}

interface PortionFormData {
  name: string;
  description: string;
  isActive: boolean;
}

export default function EditPortionModal({ 
  isOpen, 
  onClose, 
  onPortionUpdated, 
  portion 
}: EditPortionModalProps) {
  const [formData, setFormData] = useState<PortionFormData>({
    name: "",
    description: "",
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form data when portion changes
  useEffect(() => {
    if (portion) {
      setFormData({
        name: portion.name,
        description: portion.description || "",
        isActive: portion.isActive,
      });
    }
  }, [portion]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portion) return;
    
    setIsLoading(true);
    setError("");

    // Client-side validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError("Portion name is required");
      setIsLoading(false);
      return;
    }

    if (trimmedName.length < 2) {
      setError("Portion name must be at least 2 characters long");
      setIsLoading(false);
      return;
    }

    if (trimmedName.length > 50) {
      setError("Portion name must be less than 50 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/portions/${portion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          description: formData.description.trim() || null,
          isActive: formData.isActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update portion');
      }

      onPortionUpdated();
      onClose();
      showSuccessAlert('Portion updated successfully!');

    } catch (err: any) {
      setError(err.message || "Failed to update portion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  if (!isOpen || !portion) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Edit Portion Size</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Portion Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Small, Medium, Large, Family Size"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum 2 characters</span>
              <span>{formData.name.length}/50</span>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Optional description of the portion size"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active Portion
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Inactive portions cannot be used for new food items
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
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
                  Updating...
                </div>
              ) : (
                "Update Portion"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


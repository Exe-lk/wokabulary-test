"use client";

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { addItem } from '@/redux/slices/orderSlice';

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

interface FoodItemCardProps {
  item: FoodItem;
}

export default function FoodItemCard({ item }: FoodItemCardProps) {
  const dispatch = useAppDispatch();
  const { tableNumber } = useAppSelector((state) => state.order);
  const [selectedPortion, setSelectedPortion] = useState<FoodItemPortion | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddToOrder = () => {
    if (!selectedPortion) return;

    dispatch(addItem({
      foodItemId: item.id,
      foodItemName: item.name,
      portionId: selectedPortion.portionId,
      portionName: selectedPortion.portion.name,
      quantity,
      unitPrice: selectedPortion.price,
      specialRequests: specialRequests || undefined,
      imageUrl: item.imageUrl || undefined,
    }));

    // Reset form
    setQuantity(1);
    setSpecialRequests('');
    setShowAddModal(false);
    setSelectedPortion(null);
  };

  const openAddModal = () => {
    setSelectedPortion(item.foodItemPortions[0] || null);
    setShowAddModal(true);
  };

  return (
    <>
      {/* Food Item Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {item.imageUrl && (
          <div className="h-32 bg-gray-100 overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.name}</h3>
          {item.description && (
            <p className="text-gray-600 text-xs mb-3 line-clamp-2">{item.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {item.foodItemPortions.length === 1 ? (
                <span className="font-medium text-green-600">
                  Rs. {item.foodItemPortions[0].price.toFixed(2)}
                </span>
              ) : (
                <span className="font-medium text-green-600">
                  Rs. {Math.min(...item.foodItemPortions.map(p => p.price)).toFixed(2)} - 
                  Rs. {Math.max(...item.foodItemPortions.map(p => p.price)).toFixed(2)}
                </span>
              )}
            </div>
            
            {tableNumber ? (
              <button
                onClick={openAddModal}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            ) : (
              <div className="px-3 py-1.5 text-xs text-gray-400 bg-gray-100 rounded-md">
                Select table first
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add {item.name}</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Portion Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Portion
                </label>
                <div className="space-y-2">
                  {item.foodItemPortions.map((portion) => (
                    <label
                      key={portion.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                        selectedPortion?.id === portion.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="portion"
                          value={portion.id}
                          checked={selectedPortion?.id === portion.id}
                          onChange={() => setSelectedPortion(portion)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {portion.portion.name}
                          </div>
                          {portion.portion.description && (
                            <div className="text-xs text-gray-500">
                              {portion.portion.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Rs. {portion.price.toFixed(2)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Special Requests */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special instructions..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddToOrder}
                  disabled={!selectedPortion}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add to Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
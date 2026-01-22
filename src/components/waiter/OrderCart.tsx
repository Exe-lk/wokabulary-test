"use client";

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { updateItemQuantity, removeItem, updateItemSpecialRequests, setOrderNotes } from '@/redux/slices/orderSlice';

export default function OrderCart() {
  const dispatch = useAppDispatch();
  const { items, totalAmount, tableNumber, notes } = useAppSelector((state) => state.order);
  const [orderNotes, setOrderNotesLocal] = useState(notes || '');

  const handleQuantityChange = (id: string, quantity: number) => {
    dispatch(updateItemQuantity({ id, quantity }));
  };

  const handleRemoveItem = (id: string) => {
    dispatch(removeItem(id));
  };

  const handleSpecialRequestsChange = (id: string, specialRequests: string) => {
    dispatch(updateItemSpecialRequests({ id, specialRequests }));
  };

  const handleNotesChange = (newNotes: string) => {
    setOrderNotesLocal(newNotes);
    dispatch(setOrderNotes(newNotes));
  };

  if (!tableNumber) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div>
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5M7 13l-1.5 7.5m9.5-7.5v7.5" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">No active order</h3>
          <p className="text-xs text-gray-500">Enter a table number to start taking an order</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Table {tableNumber}</h2>
        <p className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Order Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-xs text-gray-500">No items added yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {items.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{item.foodItemName}</h4>
                    <p className="text-xs text-gray-600">{item.portionName}</p>
                    <p className="text-xs text-green-600 font-medium">Rs. {item.unitPrice.toFixed(2)} each</p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    Rs. {item.totalPrice.toFixed(2)}
                  </div>
                </div>

                {/* Special Requests */}
                <textarea
                  value={item.specialRequests || ''}
                  onChange={(e) => handleSpecialRequestsChange(item.id, e.target.value)}
                  placeholder="Special requests..."
                  className="w-full text-xs p-2 border border-gray-200 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Notes */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Notes
          </label>
          <textarea
            value={orderNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Any notes for the kitchen..."
            className="w-full text-sm p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>
      )}

      {/* Total and Actions */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-green-600">Rs. {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
} 
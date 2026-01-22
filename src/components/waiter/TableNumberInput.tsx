"use client";

import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setTableNumber, clearOrder } from '@/redux/slices/orderSlice';

export default function TableNumberInput() {
  const dispatch = useAppDispatch();
  const { tableNumber, isOrderInProgress, items } = useAppSelector((state) => state.order);
  const [inputValue, setInputValue] = useState('');
  const [showNewOrderConfirm, setShowNewOrderConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and highlight input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleStartNewOrder = () => {
    if (isOrderInProgress && items.length > 0) {
      setShowNewOrderConfirm(true);
    } else {
      startNewOrderDirectly();
    }
  };

  const startNewOrderDirectly = () => {
    const tableNum = parseInt(inputValue);
    if (tableNum && tableNum > 0) {
      dispatch(clearOrder());
      dispatch(setTableNumber(tableNum));
      setInputValue('');
      setShowNewOrderConfirm(false);
    }
  };

  const confirmNewOrder = () => {
    startNewOrderDirectly();
  };

  const cancelNewOrder = () => {
    setShowNewOrderConfirm(false);
    setInputValue('');
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleStartNewOrder();
  };

  return (
    <>
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <form onSubmit={handleInputSubmit} className="flex-1 flex space-x-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter table number"
              min="1"
              max="999"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              ref={inputRef}
            />
            <button
              type="submit"
              disabled={!inputValue || parseInt(inputValue) <= 0}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isOrderInProgress ? 'New Order' : 'Start Order'}
            </button>
          </form>
          
          {isOrderInProgress && (
            <button
              onClick={() => dispatch(clearOrder())}
              className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        
        {tableNumber && (
          <div className="mt-2 text-sm text-gray-600">
            Current order: <span className="font-medium text-blue-600">Table {tableNumber}</span>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showNewOrderConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Start New Order?</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                You have {items.length} item{items.length !== 1 ? 's' : ''} in your current order for Table {tableNumber}. 
                Starting a new order will clear these items. Are you sure?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelNewOrder}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmNewOrder}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Clear & Start New
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
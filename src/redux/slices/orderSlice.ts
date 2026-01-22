import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OrderItem {
  id: string;
  foodItemId: string;
  foodItemName: string;
  portionId: string;
  portionName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialRequests?: string;
  imageUrl?: string;
}

export interface OrderState {
  tableNumber: number | null;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  isOrderInProgress: boolean;
}

const initialState: OrderState = {
  tableNumber: null,
  items: [],
  totalAmount: 0,
  notes: '',
  isOrderInProgress: false,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setTableNumber: (state, action: PayloadAction<number>) => {
      state.tableNumber = action.payload;
      state.isOrderInProgress = true;
    },
    addItem: (state, action: PayloadAction<Omit<OrderItem, 'id' | 'totalPrice'>>) => {
      const newItem: OrderItem = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(),
        totalPrice: action.payload.unitPrice * action.payload.quantity,
      };
      
      // Check if the same item with same portion already exists
      const existingItemIndex = state.items.findIndex(
        item => item.foodItemId === newItem.foodItemId && 
                item.portionId === newItem.portionId &&
                item.specialRequests === newItem.specialRequests
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity and total
        state.items[existingItemIndex].quantity += newItem.quantity;
        state.items[existingItemIndex].totalPrice = 
          state.items[existingItemIndex].quantity * state.items[existingItemIndex].unitPrice;
      } else {
        // Add new item
        state.items.push(newItem);
      }
      
      // Recalculate total
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
    },
    updateItemQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        if (action.payload.quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.items = state.items.filter(item => item.id !== action.payload.id);
        } else {
          item.quantity = action.payload.quantity;
          item.totalPrice = item.quantity * item.unitPrice;
        }
        // Recalculate total
        state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      // Recalculate total
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
    },
    updateItemSpecialRequests: (state, action: PayloadAction<{ id: string; specialRequests: string }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.specialRequests = action.payload.specialRequests;
      }
    },
    setOrderNotes: (state, action: PayloadAction<string>) => {
      state.notes = action.payload;
    },
    clearOrder: (state) => {
      state.tableNumber = null;
      state.items = [];
      state.totalAmount = 0;
      state.notes = '';
      state.isOrderInProgress = false;
    },
    completeOrder: (state) => {
      // Keep the order data but mark as completed
      state.isOrderInProgress = false;
    },
  },
});

export const {
  setTableNumber,
  addItem,
  updateItemQuantity,
  removeItem,
  updateItemSpecialRequests,
  setOrderNotes,
  clearOrder,
  completeOrder,
} = orderSlice.actions;

export default orderSlice.reducer; 
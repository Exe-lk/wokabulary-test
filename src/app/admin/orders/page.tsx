"use client";

import { useState, useEffect } from "react";
import { showSuccessAlert, showErrorAlert } from "@/lib/sweetalert";

interface Order {
  id: number;
  tableNumber: number;
  staffId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialRequests: string | null;
    foodItem: {
      id: string;
      name: string;
      imageUrl: string | null;
      category: {
        id: string;
        name: string;
      };
    };
    portion: {
      id: string;
      name: string;
    };
  }>;
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        setFilteredOrders(data);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Filter orders based on search term
  useEffect(() => {
    const filtered = orders.filter(order =>
      order.id.toString().includes(searchTerm) ||
      order.tableNumber.toString().includes(searchTerm) ||
      order.staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "PREPARING":
        return "bg-orange-100 text-orange-800";
      case "READY":
        return "bg-green-100 text-green-800";
      case "SERVED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusButtonColor = (status: string, isActive: boolean) => {
    const baseColors = {
      "PENDING": "bg-yellow-500 hover:bg-yellow-600",
      "CONFIRMED": "bg-blue-500 hover:bg-blue-600", 
      "PREPARING": "bg-orange-500 hover:bg-orange-600",
      "READY": "bg-green-500 hover:bg-green-600",
      "SERVED": "bg-gray-500 hover:bg-gray-600",
      "CANCELLED": "bg-red-500 hover:bg-red-600"
    };
    
    if (isActive) {
      return baseColors[status as keyof typeof baseColors] || "bg-purple-500 hover:bg-purple-600";
    }
    return "bg-gray-200 hover:bg-gray-300 text-gray-700";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCancelOrder = async (orderId: number, orderNumber: number) => {
    // Import Swal dynamically
    const Swal = (await import('sweetalert2')).default;
    
    const result = await Swal.fire({
      title: 'Cancel Order?',
      text: `Are you sure you want to cancel Order #${orderNumber}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Cancel Order',
      cancelButtonText: 'Keep Order',
      input: 'textarea',
      inputPlaceholder: 'Optional: Enter reason for cancellation...',
      inputAttributes: {
        'aria-label': 'Reason for cancellation'
      }
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: result.value || 'Cancelled by admin' }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to cancel order');
        }

        // Refresh orders after successful cancellation
        await fetchOrders();
        
        // Show success message
        await showSuccessAlert('Success!', 'Order has been cancelled successfully.');
      } catch (err: any) {
        await showErrorAlert('Error!', err.message);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const statusOptions = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PREPARING", label: "Preparing" },
    { value: "READY", label: "Ready" },
    { value: "SERVED", label: "Served" },
    { value: "CANCELLED", label: "Cancelled" }
  ];

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      {/* <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={() => fetchOrders()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Now
            </button>
          </div>
        </div>
      </div> */}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by order ID, table, staff, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === option.value 
                    ? "text-white bg-purple-600" 
                    : getStatusButtonColor(option.value, false)
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table & Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            #{order.id}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Order #{order.id}</div>
                        <div className="text-sm text-gray-500">
                          {order.orderItems.length} items
                        </div>
                        {order.notes && (
                          <div className="text-xs text-gray-400 mt-1">
                            Note: {order.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Table {order.tableNumber}</div>
                    <div className="text-sm text-gray-500">{order.staff.name}</div>
                    <div className="text-xs text-gray-400">{order.staff.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        View Details
                      </button>
                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => handleCancelOrder(order.id, order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order #{selectedOrder.id} Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Table:</span> {selectedOrder.tableNumber}</div>
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0) + selectedOrder.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div><span className="font-medium">Total:</span> {formatCurrency(selectedOrder.totalAmount)}</div>
                    <div><span className="font-medium">Created:</span> {formatDate(selectedOrder.createdAt)}</div>
                    <div><span className="font-medium">Updated:</span> {formatDate(selectedOrder.updatedAt)}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Staff Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedOrder.staff.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedOrder.staff.email}</div>
                    <div><span className="font-medium">Role:</span> {selectedOrder.staff.role}</div>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedOrder.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.foodItem.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.portion.name} • Qty: {item.quantity} • {formatCurrency(item.unitPrice)} each
                        </div>
                        {item.specialRequests && (
                          <div className="text-xs text-gray-400 mt-1">
                            Special: {item.specialRequests}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeModal}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
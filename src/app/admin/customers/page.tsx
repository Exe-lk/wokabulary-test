"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { format } from 'date-fns';
import EditCustomerModal from '@/components/EditCustomerModal';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialRequests?: string;
  foodItem: {
    id: string;
    name: string;
  };
  portion: {
    id: string;
    name: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  receivedAmount: number;
  balance: number;
  paymentDate: string;
  paymentMode: string;
}

interface Order {
  id: number;
  tableNumber: number;
  status: string;
  totalAmount: number;
  billNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  payments: Payment[];
  staff: {
    name: string;
  };
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  orders: Order[];
  totalSpent: number;
  lastOrderDate?: string;
  orderCount: number;
  paymentCount: number;
}

interface CustomerResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    // Check if admin is logged in
    const storedUser = localStorage.getItem('adminUser');
    if (!storedUser) {
      router.push("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (!['admin', 'MANAGER', 'CASHIER'].includes(user.role)) {
        router.push("/admin/login");
        return;
      }
      setAdminUser(user);
    } catch (error) {
      console.error('Error parsing admin data:', error);
      router.push("/admin/login");
      return;
    }

    fetchCustomers();
  }, [router, currentPage, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm
      });

      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data: CustomerResponse = await response.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const toggleExpanded = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const handleEditCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setEditingCustomer(customer);
    }
  };

  const handleCustomerUpdated = () => {
    fetchCustomers();
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const Swal = (await import('sweetalert2')).default;

    const result = await Swal.fire({
      title: 'Delete Customer?',
      text: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/customers/${customerId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete customer');
        }

        await Swal.fire({
          title: 'Deleted!',
          text: 'Customer has been deleted successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });

        fetchCustomers();
      } catch (err: any) {
        await Swal.fire({
          title: 'Error!',
          text: err.message || 'Failed to delete customer.',
          icon: 'error',
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-orange-100 text-orange-800',
      READY: 'bg-purple-100 text-purple-800',
      SERVED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  if (loading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Customers...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage customer information and order history</p>
          </div>
        </div>
      </div>

      {/* Search Bar and Refresh Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={fetchCustomers}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(customers.reduce((sum, customer) => sum + customer.totalSpent, 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.reduce((sum, customer) => sum + customer.orderCount, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      customers.reduce((sum, customer) => sum + customer.totalSpent, 0) /
                      Math.max(customers.reduce((sum, customer) => sum + customer.orderCount, 0), 1)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
                <div className="text-sm text-gray-500">
                  {customers.length === 0
                    ? 'No customers found'
                    : `Showing ${(currentPage - 1) * pagination.limit + 1}-${Math.min(currentPage * pagination.limit, pagination.total)} of ${pagination.total} customers`
                  }
                  {searchTerm && (
                    <span className="ml-2">
                      for "<span className="font-medium">{searchTerm}</span>"
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <React.Fragment key={customer.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">
                                Joined {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.phone}</div>
                          {customer.email && (
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.orderCount}</div>
                          <div className="text-sm text-gray-500">{customer.paymentCount} payments</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(customer.totalSpent)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {customer.lastOrderDate ? (
                            <div className="text-sm text-gray-900">
                              {format(new Date(customer.lastOrderDate), 'MMM d, yyyy')}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No orders</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleExpanded(customer.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              {expandedCustomer === customer.id ? (
                                <>
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  Hide Orders
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  View Orders ({customer.orderCount})
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Order History */}
                      {expandedCustomer === customer.id && (
                        <tr key={`expanded-${customer.id}`}>
                          <td colSpan={6} className="px-6 py-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
                            <div className="space-y-6">
                              {/* Header Section */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900">Order History</h3>
                                    <p className="text-sm text-gray-600">{customer.name}'s purchase history</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900">{customer.orders.length}</div>
                                  <div className="text-sm text-gray-600">Total Orders</div>
                                </div>
                              </div>

                              {/* Customer Summary Stats */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                  <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-green-100">
                                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                      </svg>
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-600">Total Spent</p>
                                      <p className="text-lg font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                  <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-blue-100">
                                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                      </svg>
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-600">Avg Order</p>
                                      <p className="text-lg font-bold text-gray-900">
                                        {formatCurrency(customer.totalSpent / Math.max(customer.orderCount, 1))}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                  <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-purple-100">
                                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-600">Orders</p>
                                      <p className="text-lg font-bold text-gray-900">{customer.orderCount}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                  <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-orange-100">
                                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-600">Last Visit</p>
                                      <p className="text-lg font-bold text-gray-900">
                                        {customer.lastOrderDate
                                          ? format(new Date(customer.lastOrderDate), 'MMM d')
                                          : 'Never'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Orders List */}
                              {customer.orders.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                                  <div className="text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h4>
                                    <p className="text-gray-500">This customer hasn't placed any orders yet.</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {customer.orders.slice(0, 10).map((order, orderIndex) => (
                                    <div key={`order-${order.id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                      {/* Order Header */}
                                      <div className="p-6 border-b border-gray-100">
                                        <div className="flex items-center justify-between mb-4">
                                          <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                              #{orderIndex + 1}
                                            </div>
                                            <div>
                                              <div className="flex items-center space-x-3 mb-1">
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                  Order #{order.id}
                                                </h4>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                  {order.status.replace('_', ' ')}
                                                </span>
                                              </div>
                                              <p className="text-sm text-gray-600">
                                                {format(new Date(order.createdAt), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-2xl font-bold text-gray-900">
                                              {formatCurrency(order.totalAmount)}
                                            </div>
                                            <div className="text-sm text-gray-500">Total Amount</div>
                                          </div>
                                        </div>

                                        {/* Order Details Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                          <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                            </svg>
                                            <div>
                                              <p className="text-gray-500">Table</p>
                                              <p className="font-medium text-gray-900">#{order.tableNumber}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <div>
                                              <p className="text-gray-500">Staff</p>
                                              <p className="font-medium text-gray-900">{order.staff.name}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                              <p className="text-gray-500">Duration</p>
                                              <p className="font-medium text-gray-900">
                                                {format(new Date(order.createdAt), 'HH:mm')} - {format(new Date(order.updatedAt), 'HH:mm')}
                                              </p>
                                            </div>
                                          </div>
                                          {order.billNumber && (
                                            <div className="flex items-center space-x-2">
                                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                              </svg>
                                              <div>
                                                <p className="text-gray-500">Bill #</p>
                                                <p className="font-medium text-gray-900">{order.billNumber}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Order Items */}
                                      <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                          <h5 className="text-lg font-medium text-gray-900">Order Items</h5>
                                          <span className="text-sm text-gray-500">
                                            {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                                          </span>
                                        </div>

                                        <div className="space-y-3">
                                          {order.orderItems.map((item) => (
                                            <div key={`item-${item.id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                              <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                                                  <span className="text-sm font-bold text-gray-600">{item.quantity}x</span>
                                                </div>
                                                <div>
                                                  <h6 className="font-medium text-gray-900">{item.foodItem.name}</h6>
                                                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                      {item.portion.name}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{formatCurrency(item.unitPrice)} each</span>
                                                    {item.specialRequests && (
                                                      <>
                                                        <span>•</span>
                                                        <span className="italic">"{item.specialRequests}"</span>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-lg font-semibold text-gray-900">
                                                  {formatCurrency(item.totalPrice)}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Payment Information */}
                                        {order.payments.length > 0 && (
                                          <div className="mt-6 pt-6 border-t border-gray-200">
                                            <h5 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h5>
                                            <div className="space-y-3">
                                              {order.payments.map((payment) => (
                                                <div key={`payment-${payment.id}`} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                                  <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                      </svg>
                                                    </div>
                                                    <div>
                                                      <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-gray-900">{payment.paymentMode}</span>
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                          Paid
                                                        </span>
                                                      </div>
                                                      <p className="text-sm text-gray-600">
                                                        {format(new Date(payment.paymentDate), 'MMM d, yyyy \'at\' h:mm a')}
                                                      </p>
                                                      {payment.balance !== 0 && (
                                                        <p className="text-sm text-orange-600">
                                                          Balance: {formatCurrency(payment.balance)}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <div className="text-lg font-semibold text-gray-900">
                                                      {formatCurrency(payment.amount)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                      Received: {formatCurrency(payment.receivedAmount)}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Order Notes */}
                                        {order.notes && (
                                          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <div className="flex items-start space-x-3">
                                              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                              </svg>
                                              <div>
                                                <h6 className="font-medium text-yellow-800 mb-1">Order Notes</h6>
                                                <p className="text-sm text-yellow-700">{order.notes}</p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Show More Indicator */}
                              {customer.orders.length > 10 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                  <div className="text-center">
                                    <svg className="mx-auto h-8 w-8 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <p className="text-gray-600 font-medium">
                                      Showing latest 10 orders out of {customer.orders.length} total orders
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Contact support to view complete order history
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    Next
                  </button>
                </div>

                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>

                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={`page-${page}`}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>

          {customers.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers Found</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? `No customers match "${searchTerm}". Try adjusting your search.`
                  : 'Customers will appear here when they place orders.'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        customer={editingCustomer}
        onCustomerUpdated={handleCustomerUpdated}
      />
    </div>
  );
}

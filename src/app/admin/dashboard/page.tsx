"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  activeTables: number;
  inactiveTables: number;
  totalFoodItems: number;
  totalCategories: number;
  lowStockIngredients: number;
  revenueChange: number;
  orderCountChange: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      
      const response = await fetch('/api/admin/dashboard-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStatsError('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
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
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (adminUser) {
      fetchStats();
    }
  }, [adminUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-3 text-white">Welcome back, {adminUser.name}!</h2>
            <p className="text-blue-100 text-lg">Here's what's happening with your restaurant today.</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={statsLoading}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
            title="Refresh"
          >
            <svg 
              className={`w-5 h-5 ${statsLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100 shadow-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Today's Orders</h3>
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-blue-200 rounded mb-2"></div>
              <div className="h-4 bg-blue-200 rounded w-3/4"></div>
            </div>
          ) : statsError ? (
            <div className="text-red-600">
              <p className="text-lg">Error</p>
              <p className="text-sm">Failed to load</p>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-blue-600">{stats?.todayOrders || 0}</p>
              <p className={`text-sm mt-1 ${(stats?.orderCountChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats?.orderCountChange ?? 0) >= 0 ? '+' : ''}{stats?.orderCountChange ?? 0}% from yesterday
              </p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-lg">
          <h3 className="font-semibold text-green-900 mb-2">Revenue Today</h3>
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-green-200 rounded mb-2"></div>
              <div className="h-4 bg-green-200 rounded w-3/4"></div>
            </div>
          ) : statsError ? (
            <div className="text-red-600">
              <p className="text-lg">Error</p>
              <p className="text-sm">Failed to load</p>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-green-600">Rs. {stats?.todayRevenue?.toLocaleString() || '0'}</p>
              <p className={`text-sm mt-1 ${(stats?.revenueChange ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats?.revenueChange ?? 0) >= 0 ? '+' : ''}{stats?.revenueChange ?? 0}% from yesterday
              </p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100 shadow-lg">
          <h3 className="font-semibold text-orange-900 mb-2">Active Tables</h3>
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-orange-200 rounded mb-2"></div>
              <div className="h-4 bg-orange-200 rounded w-3/4"></div>
            </div>
          ) : statsError ? (
            <div className="text-red-600">
              <p className="text-lg">Error</p>
              <p className="text-sm">Failed to load</p>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-orange-600">{stats?.activeTables || 0}</p>
              <p className="text-sm text-orange-600 mt-1">Currently occupied</p>
            </>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-100 shadow-lg">
          <h3 className="font-semibold text-purple-900 mb-2">Menu Items</h3>
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-purple-200 rounded mb-2"></div>
              <div className="h-4 bg-purple-200 rounded w-3/4"></div>
            </div>
          ) : statsError ? (
            <div className="text-red-600">
              <p className="text-lg">Error</p>
              <p className="text-sm">Failed to load</p>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-purple-600">{stats?.totalFoodItems || 0}</p>
              <p className="text-sm text-purple-600 mt-1">Active menu items</p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 shadow-lg">
          <h3 className="font-semibold text-indigo-900 mb-2">Categories</h3>
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-indigo-200 rounded mb-2"></div>
              <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
            </div>
          ) : statsError ? (
            <div className="text-red-600">
              <p className="text-lg">Error</p>
              <p className="text-sm">Failed to load</p>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-indigo-600">{stats?.totalCategories || 0}</p>
              <p className="text-sm text-indigo-600 mt-1">Menu categories</p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-100 shadow-lg">
          <h3 className="font-semibold text-red-900 mb-2">Low Stock Alert</h3>
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-red-200 rounded mb-2"></div>
              <div className="h-4 bg-red-200 rounded w-3/4"></div>
            </div>
          ) : statsError ? (
            <div className="text-red-600">
              <p className="text-lg">Error</p>
              <p className="text-sm">Failed to load</p>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-red-600">{stats?.lowStockIngredients || 0}</p>
              <p className="text-sm text-red-600 mt-1">Ingredients need restocking</p>
            </>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/admin/ingredientmaster')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">Ingredient Management</div>
                <div className="text-sm text-gray-600">Add, edit, or remove ingredients</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/items')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">Menu Items</div>
                <div className="text-sm text-gray-600">Manage your restaurant menu</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/waiter-orders')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">View Orders</div>
                <div className="text-sm text-gray-600">Monitor and manage orders</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">More Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/admin/kitchen')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">Kitchen</div>
                <div className="text-sm text-gray-600">Place orders and manage kitchen activities</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/categories')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">Categories</div>
                <div className="text-sm text-gray-600">Manage menu categories</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/portions')}
            className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center border border-blue-100">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">Portions</div>
                <div className="text-sm text-gray-600">Manage portions and servings</div>
              </div>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
} 
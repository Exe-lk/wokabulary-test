"use client";

import { useRouter } from "next/navigation";

export default function ManagerDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('staff_user');
    sessionStorage.removeItem('staff_session');
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Manager Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, Manager!</h2>
            <p className="text-gray-600 mb-8">
              This is your manager dashboard. Here you can oversee operations, manage staff, and monitor performance.
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-blue-600">127</p>
                <p className="text-sm text-blue-600 mt-1">+12% from yesterday</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">Revenue Today</h3>
                <p className="text-3xl font-bold text-blue-600">Rs. 2,450</p>
                <p className="text-sm text-blue-600 mt-1">+8% from yesterday</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">Active Staff</h3>
                <p className="text-3xl font-bold text-blue-600">15</p>
                <p className="text-sm text-blue-600 mt-1">Currently working</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">Table Occupancy</h3>
                <p className="text-3xl font-bold text-blue-600">85%</p>
                <p className="text-sm text-blue-600 mt-1">High occupancy rate</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl text-left transform hover:scale-105">
                  <h4 className="font-semibold text-lg mb-2">View Reports</h4>
                  <p className="text-blue-100">Check daily/weekly performance metrics and analytics</p>
                </button>
                <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl text-left transform hover:scale-105">
                  <h4 className="font-semibold text-lg mb-2">Manage Staff</h4>
                  <p className="text-blue-100">Add, edit, or view staff members and their roles</p>
                </button>
                <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl text-left transform hover:scale-105">
                  <h4 className="font-semibold text-lg mb-2">Monitor Kitchen</h4>
                  <p className="text-blue-100">Check order status and kitchen timing efficiency</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
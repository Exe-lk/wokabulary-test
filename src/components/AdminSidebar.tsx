"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect } from "react";
import { showConfirmDialog } from "@/lib/sweetalert";
import packageJson from "../../package.json";

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
  onCollapseToggle?: () => void;
}

export default function AdminSidebar({ 
  isOpen, 
  onToggle, 
  isCollapsed = false, 
  onCollapseToggle 
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Get user role for display
  const [userRole, setUserRole] = useState('admin');
  
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        setUserRole(user.role);
      } catch (error) {
        console.error('Error parsing admin user data:', error);
      }
    }
  }, []);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      adminOnly: false,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: "Staff Management",
      href: "/admin/users",
      adminOnly: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      name: "Ingredient Master",
      adminOnly: false,
      href: "/admin/ingredientmaster",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      name: "Categories",
      adminOnly: false,
      href: "/admin/categories",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      name: "Portions",
      adminOnly: false,
      href: "/admin/portions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
    },
    {
      name: "Items",
      adminOnly: false,
      href: "/admin/items",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: "Billing and Orders",
      adminOnly: false,
      href: "/admin/waiter-orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: "Orders",
      adminOnly: false,
      href: "/admin/kitchen",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },

    // {
    //   name: "Reports",
    //   href: "/admin/reports",
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    //     </svg>
    //   ),
    // },
  ];

  const handleLogout = async () => {
    // Show confirmation dialog
    const result = await showConfirmDialog(
      'Confirm Logout',
      'Are you sure you want to logout?',
      'Yes, Logout',
      'Cancel'
    );

    // If user confirms logout
    if (result.isConfirmed) {
      const adminUser = localStorage.getItem('adminUser');
      let userRole = 'admin';
      
      if (adminUser) {
        try {
          const user = JSON.parse(adminUser);
          userRole = user.role;
        } catch (error) {
          console.error('Error parsing admin user data:', error);
        }
      }
      
      localStorage.removeItem('adminUser');
      
      // Redirect based on role
      if (userRole === 'CASHIER') {
        router.push('/'); // Staff login page
      } else {
        router.push('/admin/login'); // Admin login page
      }
    }
  };

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar - Fixed position, full height */}
      <div
        className={`fixed top-0 left-0 z-50 ${sidebarWidth} h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Container with Fixed Height */}
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 flex-shrink-0">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 relative">
                  <Image
                    src="/images/logo.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                </div>
                <h1 className="text-lg font-bold text-white">
                  Wokabulary RMS
                </h1>
              </div>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 mx-auto relative">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
            )}
            <div className="flex items-center space-x-2">
              {onCollapseToggle && (
                <button
                  onClick={onCollapseToggle}
                  className="hidden lg:block p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
                  </svg>
                </button>
              )}
              <button
                onClick={onToggle}
                className="lg:hidden p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation - Scrollable if needed */}
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-1">
              {navigationItems
                .filter((item) => !item.adminOnly || userRole === 'admin' || userRole === 'MANAGER')
                .map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-white/20 text-white shadow-lg border border-white/20'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <span className={`${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'} transition-colors`}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="ml-3">{item.name}</span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>
                  );
                })}
            </div>
          </nav>

          {/* Logout Button & Footer - Always at bottom */}
          <div className="flex-shrink-0 p-3 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-200 group"
              title={isCollapsed ? "Logout" : undefined}
            >
              <svg className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!isCollapsed && (
                <span className="ml-3">Logout</span>
              )}
            </button>
            {!isCollapsed && (
                <div className="mt-3 w-full flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-white/30 font-light">
                    Powered by{" "}
                    <span className="text-white/60 font-semibold text-base">
                      EXE.LK
                    </span>
                  </p>
                  <p className="text-[10px] text-white/20 font-light mt-0.5">
                    v{packageJson.version}
                  </p>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 
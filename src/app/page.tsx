"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store user data in sessionStorage for easy access
      sessionStorage.setItem('staff_user', JSON.stringify(data.user));
      sessionStorage.setItem('staff_session', JSON.stringify(data.session));

      // Redirect based on role
      switch (data.user.role) {
        case 'WAITER':
          router.push("/waiter");
          break;
        case 'KITCHEN':
          router.push("/kitchen");
          break;
        case 'MANAGER':
          router.push("/manager");
          break;
        case 'CASHIER':
          // Store cashier data in localStorage for admin dashboard access
          localStorage.setItem('adminUser', JSON.stringify(data.user));
          router.push("/admin/dashboard");
          break;
        default:
          throw new Error('Invalid user role');
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Circles */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/20 rounded-full animate-float-slow"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-cyan-200/20 rounded-full animate-float-medium"></div>
        <div className="absolute bottom-32 left-32 w-20 h-20 bg-blue-300/20 rounded-full animate-float-fast"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-cyan-300/20 rounded-full animate-float-slow"></div>
        
        {/* Floating Squares */}
        <div className="absolute top-60 left-10 w-16 h-16 bg-blue-100/30 rotate-45 animate-float-medium"></div>
        <div className="absolute top-20 right-10 w-12 h-12 bg-cyan-100/30 rotate-45 animate-float-fast"></div>
        <div className="absolute bottom-60 right-10 w-20 h-20 bg-blue-200/20 rotate-45 animate-float-slow"></div>
        
        {/* Subtle Wave Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-200/10 via-transparent to-cyan-200/10 animate-wave-slow"></div>
        </div>
        
        {/* Professional Ocean Blue Background Pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.05'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2l-6 6h-2zm4 0l4-4v2l-2 2h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="w-40 h-40 mx-auto mb-4 relative">
              <div className="w-full h-full bg-white rounded-2xl shadow-xl p-4 border border-blue-100">
                <Image
                  src="/images/logo.png"
                  alt="Restaurant Logo"
                  width={200}
                  height={200}
                  className="rounded-xl object-cover"
                  priority
                />
              </div>
            </div>
          </div>
          <p className="text-blue-700 font-medium text-center text-2xl font-bold animate-fade-in">
          Wokabulary Restaurant Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8 hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-1 text-center">
              Sign In
            </h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-900 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-blue-50/50"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-900 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-200 rounded-xl text-blue-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 pr-12 bg-blue-50/50"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-blue-100">
            <p className="text-xs text-blue-600 text-center">
              For technical support, contact your system administrator
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-blue-600">
            © 2025 Wokabulary Restaurant Management System by{" "}
            <span className="font-semibold text-blue-800">EXE.LK</span>
          </p>
        </div>
      </div>
    </div>
  );
}

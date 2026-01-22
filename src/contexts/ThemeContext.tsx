"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  id: string;
  serviceChargeRate: number;
  createdAt: string;
}

interface ThemeContextType {
  settings: Settings | null;
  updateServiceChargeRate: (rate: number) => Promise<void>;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
  getThemeClasses: () => {
    primary: string;
    primaryHover: string;
    primaryText: string;
    primaryBg: string;
    primaryBgLight: string;
    primaryBorder: string;
    accent: string;
    sidebarGradient: string;
    mainGradient: string;
    buttonGradient: string;
    buttonGradientHover: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getThemeClasses = () => {
    // Fixed ocean blue theme
    return {
      primary: 'blue-600',
      primaryHover: 'blue-700',
      primaryText: 'blue-700',
      primaryBg: 'blue-50',
      primaryBgLight: 'blue-100',
      primaryBorder: 'blue-200',
      accent: 'blue-500',
      sidebarGradient: 'from-slate-900 via-blue-900 to-slate-900',
      mainGradient: 'from-slate-50 via-blue-50 to-slate-50',
      buttonGradient: 'from-blue-600 to-cyan-600',
      buttonGradientHover: 'from-blue-700 to-cyan-700',
    };
  };

  const refreshSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  
  const updateServiceChargeRate = async (rate: number) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceChargeRate: rate }),
      });

      if (response.ok) {
        await refreshSettings();
      } else {
        throw new Error('Failed to update service charge rate');
      }
    } catch (error) {
      console.error('Error updating service charge rate:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshSettings().finally(() => setIsLoading(false));
  }, []);

  const value: ThemeContextType = {
    settings,
    updateServiceChargeRate,
    refreshSettings,
    isLoading,
    getThemeClasses,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 
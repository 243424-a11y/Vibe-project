import React from 'react';

const publicPath = process.env.PUBLIC_URL || '/';

export const tailwindConfig = () => ({
  theme: {
    colors: {
      primary: '#1e40af',
      secondary: '#f59e0b',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f97316',
      info: '#0ea5e9',
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827'
      }
    }
  }
});

export const colors = {
  primary: '#1e40af',
  secondary: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f97316',
  info: '#0ea5e9',
  gray: '#6b7280'
};

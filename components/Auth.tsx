import React from 'react';
import { GoogleIcon } from './icons/GoogleIcon';

interface AuthProps {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export const Auth: React.FC<AuthProps> = ({ isAuthenticated, isAuthReady, onLogin, onLogout }) => {
  if (!isAuthReady) {
    return (
      <button
        disabled
        className="flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 opacity-50 cursor-wait"
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Chargement...
      </button>
    );
  }

  if (isAuthenticated) {
    return (
      <button
        onClick={onLogout}
        className="flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
      >
        Se déconnecter
      </button>
    );
  }

  return (
    <button
      onClick={onLogin}
      className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
    >
      <GoogleIcon className="w-5 h-5 mr-2" />
      Se connecter
    </button>
  );
};

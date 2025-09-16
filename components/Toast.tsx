import React, { useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface ToastProps {
  id: number;
  message: string;
  onClose: (id: number) => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ id, message, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [id, duration, onClose]);

  return (
    <div
      className="max-w-sm w-full bg-red-900/80 backdrop-blur-md shadow-lg rounded-lg pointer-events-auto ring-1 ring-red-500 ring-opacity-5 overflow-hidden animate-fade-in-right"
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-red-200">Erreur</p>
            <p className="mt-1 text-sm text-red-300">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onClose(id)}
              className="rounded-md inline-flex text-red-300 hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-900 focus:ring-white"
            >
              <span className="sr-only">Fermer</span>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple animation for the toast
const styles = `
@keyframes fade-in-right {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-fade-in-right {
  animation: fade-in-right 0.3s ease-out forwards;
}
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

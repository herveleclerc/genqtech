import React from 'react';
import { Toast } from './Toast';

interface ToastData {
  id: number;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} id={toast.id} message={toast.message} onClose={onClose} />
        ))}
      </div>
    </div>
  );
};

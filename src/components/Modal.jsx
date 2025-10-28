'use client';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, size = 'max-w-xl' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${size} transform transition-all p-6 space-y-4`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

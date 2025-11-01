'use client';
import { Loader2 } from 'lucide-react';

export const CardSplat = () => (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 right-0">
        <path d="M80 0H0C0 0 24.7826 6.64444 36.9565 20.1556C49.1304 33.6667 52.1739 60 52.1739 60C52.1739 60 72.3913 54.8 80 42.4V0Z" className="fill-red-100 dark:fill-red-900/40" />
        <path d="M80 0H23.0435C23.0435 0 43.4783 4.42963 52.8261 13.437C62.1739 22.4444 63.4783 40 63.4783 40C63.4783 40 76.5217 36.5333 80 28.2667V0Z" className="fill-red-200 dark:fill-red-800/60" />
        <path d="M80 0H39.1304C39.1304 0 54.7826 2.95309 61.7391 8.95802C68.6957 14.963 68.6957 26.6667 68.6957 26.6667C68.6957 26.6667 77.3913 24.3556 80 18.8444V0Z" className="fill-red-500 dark:fill-red-600" />
    </svg>
);

export const SoccerBallIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600 dark:text-gray-400">
        <path d="M16 29.3333C23.3638 29.3333 29.3333 23.3638 29.3333 16C29.3333 8.63619 23.3638 2.66666 16 2.66666C8.63619 2.66666 2.66666 8.63619 2.66666 16C2.66666 23.3638 8.63619 29.3333 16 29.3333Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21.6667 22.6L16 25.3333L10.3333 22.6L8 16L10.3333 9.39999L16 6.66666L21.6667 9.39999L24 16L21.6667 22.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.66666 12H2.66666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M29.3333 12H25.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.3333 22.6L6.89331 26.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21.6667 22.6L25.1067 26.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.3333 9.39999L6.89331 5.19999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21.6667 9.39999L25.1067 5.19999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 6.66666V2.66666" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 29.3333V25.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 16L2.66666 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 16H29.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false, size = 'default', ...props }) => {
    const baseClasses = 'rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center';

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        default: 'px-4 py-3',
        lg: 'px-6 py-4 text-lg'
    };

    const variants = {
        primary: 'bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-500',
        secondary: 'bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500',
        tertiary: 'bg-transparent text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
        outline: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 hover:border-gray-400 dark:hover:bg-gray-700 dark:hover:border-gray-500',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${sizeClasses[size]} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export const IconButton = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false, title, ...props }) => {
    const baseClasses = 'rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center shrink-0';

    const variants = {
        primary: 'bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-500',
        secondary: 'bg-gray-500 text-white hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500',
        tertiary: 'bg-transparent text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
        outline: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`${baseClasses} h-[50px] w-[50px] ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export const Input = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" />
    </div>
);
export const Textarea = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <textarea {...props} rows="4" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" />
    </div>
);
export const Select = ({ label, children, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <select {...props} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500">
            {children}
        </select>
    </div>
);

export const Loading = ({ message = "Carregando..." }) => (
    <div className="flex flex-col justify-center items-center h-64 space-y-3">
        <Loader2 className="h-10 w-10 text-red-600 dark:text-red-500 animate-spin" />
        <p className="text-gray-700 dark:text-gray-300 text-sm opacity-60">
            {message}
        </p>
    </div>
);

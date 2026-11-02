import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'sand';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 gap-1.5 font-semibold tracking-wide',
    md: 'text-sm px-5 py-2.5 gap-2 font-semibold',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white shadow-sm hover:shadow focus:ring-forest-600',
    secondary:
      'bg-clay-500 hover:bg-clay-600 active:bg-clay-700 text-white shadow-sm hover:shadow focus:ring-clay-500',
    outline:
      'border border-sand-300 hover:border-forest-600 hover:bg-forest-50/60 text-charcoal-800 focus:ring-forest-600 bg-white',
    ghost:
      'text-charcoal-700 hover:bg-sand-100 hover:text-charcoal-900 focus:ring-sand-400',
    sand:
      'bg-sand-200 hover:bg-sand-300 text-charcoal-800 focus:ring-sand-400 font-semibold',
  };

  return (
    <button
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-sand-200/90 editorial-card overflow-hidden transition-all duration-300 ${
        hoverable ? 'hover:-translate-y-1 hover:border-sand-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

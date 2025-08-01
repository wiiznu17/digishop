// components/Button.tsx
import React from 'react';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  color?: string;
  colorHover?: string;
  colorHoverBorder?: string;
  text?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  color = 'white',
  colorHover = 'gray-400',
  colorHoverBorder = 'gray-500',
  text = 'black',
}) => {
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg '
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-medium rounded-xl ${sizeClasses[size]} text-${text} border-2 border-gray-300 bg-${color} hover:bg-${colorHover}  hover:border-${colorHoverBorder} focus:ring-gray-300 ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
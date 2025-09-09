// components/Button.tsx
import React from 'react';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  color?: string;
  colorHover?: string;
  colorHoverBorder?: string;
  textColor?: string;
  border?: string
  hidden?:boolean
}

const Button: React.FC<ButtonProps> = ({
  children,
  hidden,
  size = 'md',
  onClick,
  disabled = false,
  className,
  color,
  colorHover,
  colorHoverBorder,
  textColor = 'black',
  border = 'border-gray-300'
}) => {
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      color={color}
      hidden={hidden}
      className={`font-medium hover:cursor-pointer rounded-full ${sizeClasses[size]} text-${textColor} border-2 ${border} ${color} ${className} ${colorHover} ${colorHoverBorder}`}
    >
      {children}
    </button>
  );
};

export default Button;
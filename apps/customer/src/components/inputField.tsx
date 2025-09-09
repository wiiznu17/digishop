// components/InputField.tsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'num';
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
  maxLength?: number;
  minLength?: number
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  required,
  className = '',
  maxLength,
  minLength,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const whiteListRegexText = /^[\u0E00-\u0E7Fa-zA-Z ]+$/
  const whiteListRegexTel = /^[0-9]+$/

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          className={`w-full p-4  border rounded-lg shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {!showPassword ? <EyeOff size={18} className='' /> : <Eye size={18} />}
          </button>
        )}
        {error && <p className="text-sm text-red-600 px-2">{error}</p>}
        {!whiteListRegexText.test(value) && type === 'text' && value.length > 0 && <p className="text-sm text-red-600 px-2">* accept only ก-ฮ, a-z, A-Z</p>}
        {!whiteListRegexTel.test(value) && type === 'num' && value != null && value.length > 0 && <p className="text-sm text-red-600 px-2">* accept only number</p>}
      </div>
      
    </div>
  );
};

export default InputField;
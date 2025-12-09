/**
 * @file PercentageInput.tsx
 * @description Input component for percentage values with visual indicator
 * The % symbol is displayed outside the input for better UX
 */

import React from 'react';

interface PercentageInputProps {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly placeholder?: string;
  readonly min?: number;
  readonly max?: number;
  readonly theme?: 'light' | 'dark';
}

export const PercentageInput: React.FC<PercentageInputProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder = '0',
  min = 0,
  max = 100,
  theme = 'light',
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  // Format display value when not focused
  const displayValue = React.useMemo(() => {
    if (isFocused) {
      return inputValue;
    }
    if (value === 0) {
      return '';
    }
    // Show value without % symbol
    return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }, [value, inputValue, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setInputValue(value === 0 ? '' : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    setInputValue('');
    
    // Parse and validate
    const numValue = inputValue === '' ? 0 : Number(inputValue);
    if (Number.isFinite(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only numbers and decimal point
    const cleaned = input.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : cleaned;
    
    setInputValue(formatted);
  };

  const baseClasses = `
    px-2 py-1 border rounded text-sm text-center
    focus:outline-none focus:ring-2 focus:ring-yellow-500
    transition-colors
  `;

  const themeClasses = theme === 'light'
    ? 'border-gray-300 bg-white text-gray-900'
    : 'border-gray-600 bg-gray-700 text-gray-100';

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <div className="relative inline-flex items-center">
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={`${baseClasses} ${themeClasses} ${disabledClasses} ${className} pr-6`}
      />
      <span 
        className={`absolute right-2 text-sm pointer-events-none ${
          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        %
      </span>
    </div>
  );
};

import React from 'react';
import { toEnglishDigits, sanitizeNumberInput } from '../utils.js';

/**
 * Enhanced Numeric Input
 * Solves the issue where browser <input type="number"> blocks Persian/Farsi digits,
 * gets stuck with spinner arrows, or makes typing numbers difficult.
 * Accepts typing in English, Persian (۰-۹), and Arabic (٠-٩) numerals,
 * supports decimal points, backspace, and direct typing.
 */
export default function NumericInput({
  value,
  onChange,
  placeholder = '',
  min,
  max,
  step = 'any',
  allowDecimals = true,
  className = '',
  disabled = false,
  required = false,
  autoFocus = false,
  ...props
}) {
  const handleChange = (e) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeNumberInput(rawVal, allowDecimals);
    onChange(sanitized);
  };

  return (
    <input
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      dir="ltr"
      value={value === undefined || value === null ? '' : value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      className={`font-mono text-left ${className}`}
      {...props}
    />
  );
}

import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { TextFieldProps } from '@mui/material/TextField';

interface FormDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  slotProps?: {
    textField?: Partial<TextFieldProps>;
  };
}

/**
 * Reusable DatePicker component that wraps MUI X DatePicker
 * and maintains compatibility with existing form string-based date values (YYYY-MM-DD format)
 * Automatically adapts to mobile and desktop interfaces
 *
 * Note: Requires LocalizationProvider to be set up at the app level
 */
export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  fullWidth = false,
  error = false,
  helperText,
  slotProps,
}) => {
  // Convert string value to Dayjs object for the DatePicker
  const dayjsValue = value ? dayjs(value) : null;

  // Handle date change and convert back to string format (YYYY-MM-DD)
  const handleDateChange = (newValue: Dayjs | null) => {
    if (newValue && newValue.isValid()) {
      onChange(newValue.format('YYYY-MM-DD'));
    } else {
      onChange('');
    }
  };

  return (
    <DatePicker
      label={label}
      value={dayjsValue}
      onChange={handleDateChange}
      disabled={disabled}
      slotProps={{
        textField: {
          fullWidth,
          error,
          helperText,
          ...slotProps?.textField,
        },
      }}
    />
  );
};

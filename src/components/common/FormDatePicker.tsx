import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
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
  const dayjsValue = value ? dayjs(value) : null;

  const handleDateChange = (newValue: Dayjs | null) => {
    if (newValue && newValue.isValid()) {
      onChange(newValue.format('YYYY-MM-DD'));
    } else {
      onChange('');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
    </LocalizationProvider>
  );
};

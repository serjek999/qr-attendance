"use client"

import * as React from 'react';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

export default function StudentRegistrationCalendar({ 
  selectedDate, 
  onDateChange, 
  disabled = false,
  className = "" 
}) {
  const [value, setValue] = React.useState(
    selectedDate ? dayjs(selectedDate) : null
  );

  // Update value when selectedDate prop changes
  React.useEffect(() => {
    setValue(selectedDate ? dayjs(selectedDate) : null);
  }, [selectedDate]);

  const handleDateChange = (newValue) => {
    setValue(newValue);
    if (newValue && onDateChange) {
      // Convert Dayjs to YYYY-MM-DD format for the form
      onDateChange(newValue.format('YYYY-MM-DD'));
    }
  };

  return (
    <div className={className}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar 
          value={value} 
          onChange={handleDateChange}
          disabled={disabled}
          maxDate={dayjs()} // Cannot select future dates
          sx={{
            '& .MuiPickersCalendarHeader-root': {
              color: 'white',
            },
            '& .MuiPickersCalendarHeader-switchViewButton': {
              color: 'white',
            },
            '& .MuiPickersDay-root': {
              color: 'white',
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
            '& .MuiPickersDay-root.Mui-disabled': {
              color: 'rgba(255, 255, 255, 0.3)',
            },
            '& .MuiPickersCalendarHeader-label': {
              color: 'white',
            },
            '& .MuiPickersCalendarHeader-arrowButton': {
              color: 'white',
            },
            '& .MuiPickersCalendarHeader-arrowButton.Mui-disabled': {
              color: 'rgba(255, 255, 255, 0.3)',
            },
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            width: '100%',
            maxWidth: '320px',
          }}
        />
      </LocalizationProvider>
    </div>
  );
} 
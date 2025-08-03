"use client"

import * as React from 'react';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

function Calendar({
  className,
  selected,
  onSelect,
  disabled,
  ...props
}) {
  // Convert selected Date to Dayjs object
  const [value, setValue] = React.useState(
    selected ? dayjs(selected) : null
  );

  // Update value when selected prop changes
  React.useEffect(() => {
    setValue(selected ? dayjs(selected) : null);
  }, [selected]);

  const handleDateChange = (newValue) => {
    setValue(newValue);
    if (newValue && onSelect) {
      // Convert Dayjs to Date object
      onSelect(newValue.toDate());
    }
  };

  return (
    <div className={className}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar 
          value={value} 
          onChange={handleDateChange}
          disabled={disabled}
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
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
          {...props}
        />
      </LocalizationProvider>
    </div>
  );
}

export { Calendar }

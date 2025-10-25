import React from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TextField } from '@mui/material';
import dayjs from 'dayjs';

const InvertedTimePicker = ({ label, value, onChange, renderInput, ...props }) => {
  const times = Array.from({ length: 24 }, (_, i) => 23 - i); // 23 → 0
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 0 → 59

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        label={label}
        value={value}
        onChange={onChange}
        renderInput={renderInput}
        ampm={false}
        views={['hours', 'minutes']}
        slots={{
          // Sobrescribimos el panel de horas
          hours: (slotProps) => (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '8px'
            }}>
              <div style={{
                padding: '8px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                marginBottom: '8px',
                borderRadius: '4px'
              }}>
                Horas
              </div>
              {times.map((h) => (
                <div
                  key={h}
                  onClick={() => {
                    const currentTime = slotProps.value || dayjs();
                    const newTime = currentTime.hour(h).minute(currentTime.minute());
                    slotProps.onChange(newTime);
                  }}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    borderRadius: '4px',
                    margin: '2px 0',
                    background: slotProps.value?.hour() === h ? '#1976d2' : 'transparent',
                    color: slotProps.value?.hour() === h ? 'white' : 'inherit',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (slotProps.value?.hour() !== h) {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (slotProps.value?.hour() !== h) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>
          ),
          // Sobrescribimos el panel de minutos
          minutes: (slotProps) => (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '8px'
            }}>
              <div style={{
                padding: '8px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                marginBottom: '8px',
                borderRadius: '4px'
              }}>
                Minutos
              </div>
              {minutes.map((m) => (
                <div
                  key={m}
                  onClick={() => {
                    const currentTime = slotProps.value || dayjs();
                    const newTime = currentTime.hour(currentTime.hour()).minute(m);
                    slotProps.onChange(newTime);
                  }}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    borderRadius: '4px',
                    margin: '2px 0',
                    background: slotProps.value?.minute() === m ? '#1976d2' : 'transparent',
                    color: slotProps.value?.minute() === m ? 'white' : 'inherit',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (slotProps.value?.minute() !== m) {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (slotProps.value?.minute() !== m) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {String(m).padStart(2, '0')}
                </div>
              ))}
            </div>
          ),
        }}
        {...props}
      />
    </LocalizationProvider>
  );
};

export default InvertedTimePicker;

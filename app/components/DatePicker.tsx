'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';

interface DatePickerProps {
  selectedDates: Date[];
  onChange: (dates: Date[]) => void;
}

export function DatePicker({ selectedDates, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        calendarRef.current &&
        !calendarRef.current.contains(target) &&
        calendarDropdownRef.current &&
        !calendarDropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const updatePosition = () => {
      if (calendarDropdownRef.current && calendarRef.current) {
        const buttonRect = calendarRef.current.getBoundingClientRect();
        calendarDropdownRef.current.style.top = `${buttonRect.bottom + 8}px`;
        calendarDropdownRef.current.style.left = `${buttonRect.left}px`;
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;

    const dayString = day.toISOString().split('T')[0];
    const isSelected = selectedDates.some(
      d => d.toISOString().split('T')[0] === dayString
    );

    if (isSelected) {
      onChange(selectedDates.filter(
        d => d.toISOString().split('T')[0] !== dayString
      ));
    } else {
      onChange([...selectedDates, day].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const removeDate = (dateToRemove: Date) => {
    const dateString = dateToRemove.toISOString().split('T')[0];
    onChange(selectedDates.filter(
      d => d.toISOString().split('T')[0] !== dateString
    ));
  };

  const modifiers = {
    selected: selectedDates,
  };

  const modifiersClassNames = {
    selected: 'rdp-day_selected',
  };

  return (
    <div ref={calendarRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 16px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          background: '#fff',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          fontSize: '14px',
          color: '#374151',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#0d5a6f';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        <span>{selectedDates.length > 0 ? `${selectedDates.length} date(s) selected` : 'Select booking dates'}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={calendarDropdownRef}
          style={{
            position: 'fixed',
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '20px',
            zIndex: 10000,
            minWidth: '320px',
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .rdp {
              --rdp-cell-size: 40px;
              --rdp-accent-color: #0d5a6f;
              --rdp-background-color: #f0f9ff;
              --rdp-accent-color-dark: #0a4a5a;
              --rdp-outline: 2px solid var(--rdp-accent-color);
              --rdp-outline-selected: 2px solid var(--rdp-accent-color);
              margin: 0;
            }
            .rdp-day {
              border-radius: 8px;
              font-weight: 500;
              transition: all 0.2s;
            }
            .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
              background-color: #f0f9ff;
              color: #0d5a6f;
            }
            .rdp-day_selected {
              background-color: #0d5a6f !important;
              color: #fff !important;
              font-weight: 600;
            }
            .rdp-day_selected:hover {
              background-color: #0a4a5a !important;
            }
            .rdp-day[disabled] {
              color: #9ca3af;
              background-color: #f3f4f6;
              cursor: not-allowed;
            }
            .rdp-caption_label {
              font-weight: 600;
              font-size: 16px;
              color: #1f2937;
            }
            .rdp-nav_button {
              border-radius: 6px;
              transition: all 0.2s;
            }
            .rdp-nav_button:hover {
              background-color: #f3f4f6;
            }
            .rdp-head_cell {
              font-weight: 600;
              color: #6b7280;
              font-size: 12px;
            }
            .rdp-month {
              margin: 0;
            }
          `}} />
          <DayPicker
            mode="multiple"
            selected={selectedDates}
            onDayClick={handleDayClick}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
            className="modern-calendar"
            style={{
              color: '#1f2937',
            }}
          />
        </div>,
        document.body
      )}

      {/* Selected Dates Pills */}
      {selectedDates.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {selectedDates.map((date, index) => (
            <span
              key={index}
              style={{
                padding: '8px 12px',
                background: '#0d5a6f',
                color: '#fff',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              <button
                type="button"
                onClick={() => removeDate(date)}
                style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  fontWeight: 'bold',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

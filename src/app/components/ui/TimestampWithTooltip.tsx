'use client';

import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import React, { useEffect, useState } from 'react';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
import './TimestampWithTooltip.css';

interface TimestampWithTooltipProps {
  date: Date | string;
  className?: string;
  showSeconds?: boolean;
  updateInterval?: number; // milliseconds, default 60000 (1 minute)
}

interface TimeUnit {
  value: number;
  unit: string;
}

export const TimestampWithTooltip: React.FC<TimestampWithTooltipProps> = ({
  date,
  className = '',
  showSeconds = false,
  updateInterval = 60000
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [userTimezone, setUserTimezone] = useState<string>('UTC');

  // Parse the date to ensure we have a Date object
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;

  // Get user's timezone
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(timezone);
    } catch (error) {
      console.warn('Could not detect user timezone, falling back to UTC');
      setUserTimezone('UTC');
    }
  }, []);

  // Update current time for real-time relative time updates
  useEffect(() => {
    // Update more frequently when tooltip is visible for real-time updates
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second for real-time display

    return () => clearInterval(interval);
  }, []);

  // Calculate time difference in various units
  const getTimeUnits = (date: Date): TimeUnit[] => {
    const now = currentTime;
    const diff = now - date.getTime();

    if (diff < 0) return [{ value: 0, unit: 'seconds' }];

    const units = [
      { value: Math.floor(diff / (365 * 24 * 60 * 60 * 1000)), unit: 'years' },
      {
        value: Math.floor(
          (diff % (365 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000)
        ),
        unit: 'months'
      },
      {
        value: Math.floor(
          (diff % (30 * 24 * 60 * 60 * 1000)) / (7 * 24 * 60 * 60 * 1000)
        ),
        unit: 'weeks'
      },
      {
        value: Math.floor(
          (diff % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)
        ),
        unit: 'days'
      },
      {
        value: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
        unit: 'hours'
      },
      {
        value: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
        unit: 'minutes'
      },
      { value: Math.floor((diff % (60 * 1000)) / 1000), unit: 'seconds' }
    ];

    return units.filter((unit) => unit.value > 0);
  };

  // Format relative time with two precision units
  const formatRelativeTime = (date: Date): string => {
    const units = getTimeUnits(date);

    if (units.length === 0) {
      return 'just now';
    }

    // Take first two non-zero units for precision
    const significantUnits = units.slice(0, 2);

    const parts = significantUnits.map((unit) => {
      const value = unit.value;
      const unitName = value === 1 ? unit.unit.slice(0, -1) : unit.unit; // Remove 's' for singular
      return `${value} ${unitName}`;
    });

    return parts.join(' and ') + ' ago';
  };

  // Format full timestamp for tooltip
  const formatFullTimestamp = (date: Date): string => {
    const units = getTimeUnits(date);

    if (units.length === 0) {
      return 'just now';
    }

    const parts = units.map((unit) => {
      const value = unit.value;
      const unitName = value === 1 ? unit.unit.slice(0, -1) : unit.unit;
      return `${value} ${unitName}`;
    });

    return parts.join(', ') + ' ago';
  };

  // Create tooltip content
  const tooltipContent = (
    <div style={{ minWidth: '280px', maxWidth: '350px' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom:
            '1px solid var(--glass-border-overlay-light, var(--brand-tertiary--light))',
          marginBottom: '8px'
        }}
      >
        <h4
          style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white'
          }}
        >
          Exact Time
        </h4>
        <div
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.8)'
          }}
        >
          {formatFullTimestamp(parsedDate)}
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div
          style={{
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: '500',
            color: 'white'
          }}
        >
          UTC Time
        </div>
        <div
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontFamily: 'var(--font-mono, monospace)'
          }}
        >
          {formatInTimeZone(parsedDate, 'UTC', 'yyyy-MM-dd HH:mm:ss')} UTC
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div
          style={{
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: '500',
            color: 'white'
          }}
        >
          Your Local Time ({userTimezone})
        </div>
        <div
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontFamily: 'var(--font-mono, monospace)'
          }}
        >
          {formatInTimeZone(
            parsedDate,
            userTimezone,
            'yyyy-MM-dd HH:mm:ss zzz'
          )}
        </div>
      </div>
    </div>
  );

  const relativeTime = formatRelativeTime(parsedDate);

  return (
    <InteractiveTooltip
      content={tooltipContent}
      isInsideParagraph={true}
      delay={200}
      className="timestamp-tooltip"
    >
      <span
        className={`timestamp-with-tooltip ${className}`}
        style={{
          cursor: 'help',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: '2px'
        }}
      >
        {relativeTime}
      </span>
    </InteractiveTooltip>
  );
};

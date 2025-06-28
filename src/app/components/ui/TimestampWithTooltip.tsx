'use client';

import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import React, { useEffect, useState } from 'react';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
import './TimestampWithTooltip.css';

interface TimestampWithTooltipProps {
  date: Date | string | null;
  className?: string;
  showSeconds?: boolean;
  updateInterval?: number; // milliseconds, default 60000 (1 minute)
  abbreviated?: boolean; // New prop for compact display
}

interface TimeUnit {
  value: number;
  unit: string;
  isFuture?: boolean;
}

export const TimestampWithTooltip: React.FC<TimestampWithTooltipProps> = ({
  date,
  className = '',
  showSeconds = false,
  updateInterval = 60000,
  abbreviated = false
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [userTimezone, setUserTimezone] = useState<string>('UTC');

  // Parse the date to ensure we have a Date object
  const parsedDate = date
    ? typeof date === 'string'
      ? parseISO(date)
      : date
    : null;

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

  // Handle null dates after hooks
  if (!parsedDate) {
    return (
      <span className={`timestamp-with-tooltip ${className}`}>
        Unknown time
      </span>
    );
  }

  // Debug logging for invalid dates
  if (isNaN(parsedDate.getTime())) {
    // eslint-disable-next-line no-console
    console.error('TimestampWithTooltip: Invalid date received', {
      originalDate: date,
      parsedDate,
      isValidDate: parsedDate instanceof Date && !isNaN(parsedDate.getTime()),
      getTime: parsedDate?.getTime(),
      stack: new Error().stack?.split('\n').slice(0, 5).join('\n')
    });

    return (
      <span className={`timestamp-with-tooltip ${className}`}>
        Invalid time
      </span>
    );
  }

  // Calculate time difference in various units
  const getTimeUnits = (date: Date): TimeUnit[] => {
    const now = currentTime;
    const diff = now - date.getTime();
    const absDiff = Math.abs(diff);
    const isFuture = diff < 0;

    // Debug logging for suspicious time calculations
    if (absDiff <= 1000) {
      // Less than 1 second difference
      // eslint-disable-next-line no-console
      // console.warn(
      //   'TimestampWithTooltip: Very recent or future timestamp detected',
      //   {
      //     now,
      //     dateTime: date.getTime(),
      //     diff,
      //     dateString: date.toISOString(),
      //     isNaN: isNaN(date.getTime()),
      //     isFuture,
      //     stack: new Error().stack?.split('\n').slice(0, 3).join('\n')
      //   }
      // );
    }

    // For very small differences (less than 1 second), treat as "now"
    if (absDiff < 1000) return [{ value: 0, unit: 'seconds', isFuture }];

    const units = [
      {
        value: Math.floor(absDiff / (365 * 24 * 60 * 60 * 1000)),
        unit: 'years'
      },
      {
        value: Math.floor(
          (absDiff % (365 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000)
        ),
        unit: 'months'
      },
      {
        value: Math.floor(
          (absDiff % (30 * 24 * 60 * 60 * 1000)) / (7 * 24 * 60 * 60 * 1000)
        ),
        unit: 'weeks'
      },
      {
        value: Math.floor(
          (absDiff % (7 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)
        ),
        unit: 'days'
      },
      {
        value: Math.floor((absDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
        unit: 'hours'
      },
      {
        value: Math.floor((absDiff % (60 * 60 * 1000)) / (60 * 1000)),
        unit: 'minutes'
      },
      { value: Math.floor((absDiff % (60 * 1000)) / 1000), unit: 'seconds' }
    ];

    const nonZeroUnits = units.filter((unit) => unit.value > 0);

    // Mark units as future if the timestamp is in the future
    return nonZeroUnits.map((unit) => ({
      ...unit,
      isFuture
    }));
  };

  // Format abbreviated time with fixed width for footer
  const formatAbbreviatedTime = (date: Date): string => {
    const units = getTimeUnits(date);

    if (units.length === 0) {
      return 'now';
    }

    // Take only the largest unit for abbreviated display
    const largestUnit = units[0];
    const value = largestUnit.value;
    const unit = largestUnit.unit;
    const isFuture = largestUnit.isFuture;

    // Use consistent abbreviations with fixed character width
    let timeStr = '';
    switch (unit) {
      case 'years':
        timeStr = `${value}y`;
        break;
      case 'months':
        timeStr = `${value}mo`;
        break;
      case 'weeks':
        timeStr = `${value}w`;
        break;
      case 'days':
        timeStr = `${value}d`;
        break;
      case 'hours':
        timeStr = `${value}h`;
        break;
      case 'minutes':
        timeStr = `${value}m`;
        break;
      case 'seconds':
        timeStr = `${value}s`;
        break;
      default:
        return 'now';
    }

    return isFuture ? `in ${timeStr}` : timeStr;
  };

  // Format relative time with two precision units
  const formatRelativeTime = (date: Date): string => {
    const units = getTimeUnits(date);

    if (units.length === 0) {
      return 'just now';
    }

    // Take first two non-zero units for precision
    const significantUnits = units.slice(0, 2);
    const isFuture = significantUnits[0]?.isFuture;

    const parts = significantUnits.map((unit) => {
      const value = unit.value;
      const unitName = value === 1 ? unit.unit.slice(0, -1) : unit.unit; // Remove 's' for singular
      return `${value} ${unitName}`;
    });

    const timeStr = parts.join(' and ');
    return isFuture ? `in ${timeStr}` : `${timeStr} ago`;
  };

  // Format full timestamp for tooltip
  const formatFullTimestamp = (date: Date): string => {
    const units = getTimeUnits(date);

    if (units.length === 0) {
      return 'just now';
    }

    const isFuture = units[0]?.isFuture;

    const parts = units.map((unit) => {
      const value = unit.value;
      const unitName = value === 1 ? unit.unit.slice(0, -1) : unit.unit;
      return `${value} ${unitName}`;
    });

    const timeStr = parts.join(', ');
    return isFuture ? `in ${timeStr}` : `${timeStr} ago`;
  };

  // Create tooltip content
  const tooltipContent = (
    <div>
      <div
        style={{
          padding: '10px 12px',
          borderBottom:
            '1px solid var(--glass-border-overlay-light, var(--brand-tertiary--light))',
          marginBottom: '6px'
        }}
      >
        <h4
          style={{
            margin: '0 0 6px 0',
            fontSize: '13px',
            fontWeight: '600',
            color: 'white'
          }}
        >
          Exact Time
        </h4>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
            wordWrap: 'break-word'
          }}
        >
          {formatFullTimestamp(parsedDate)}
        </div>
      </div>

      <div style={{ padding: '0 12px 10px' }}>
        <div
          style={{
            marginBottom: '6px',
            fontSize: '11px',
            fontWeight: '500',
            color: 'white'
          }}
        >
          UTC Time
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontFamily: 'var(--font-mono, monospace)',
            wordWrap: 'break-word'
          }}
        >
          {formatInTimeZone(parsedDate, 'UTC', 'yyyy-MM-dd HH:mm:ss')} UTC
        </div>
      </div>

      <div style={{ padding: '0 12px 10px' }}>
        <div
          style={{
            marginBottom: '6px',
            fontSize: '11px',
            fontWeight: '500',
            color: 'white'
          }}
        >
          Your Local Time ({userTimezone})
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontFamily: 'var(--font-mono, monospace)',
            wordWrap: 'break-word'
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

  const relativeTime = abbreviated
    ? formatAbbreviatedTime(parsedDate)
    : formatRelativeTime(parsedDate);

  return (
    <InteractiveTooltip
      content={tooltipContent}
      isInsideParagraph={true}
      delay={200}
      className="timestamp-tooltip timestamp-tooltip-wrapper"
    >
      <span
        className={`timestamp-with-tooltip ${abbreviated ? 'abbreviated' : ''} ${className}`}
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

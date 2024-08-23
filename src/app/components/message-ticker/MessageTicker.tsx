'use client';
import { useEffect, useRef, useState } from 'react';
import './MessageTicker.css';

interface MessageTickerProps {
  messages?: string[];
}

export function MessageTicker({ messages = [] }: MessageTickerProps) {
  const tickerRef = useRef<HTMLDivElement>(null);
  const [animationDuration, setAnimationDuration] = useState('40s');

  useEffect(() => {
    if (tickerRef.current) {
      const tickerWidth = tickerRef.current.scrollWidth;
      const containerWidth = tickerRef.current.parentElement?.offsetWidth || 0;
      const duration = (tickerWidth / containerWidth) * 20;
      setAnimationDuration(`${duration}s`);
    }
  }, [messages]);

  const repeatedMessages =
    messages.length === 1
      ? [
          ...messages,
          ...messages,
          ...messages,
          ...messages,
          ...messages,
          ...messages
        ] // replicate to ensure maximised use of horizontal empty space
      : messages;

  return (
    <div className="message-ticker__container">
      <div
        className="message-ticker__content"
        ref={tickerRef}
        style={{ animationDuration }}
      >
        {repeatedMessages.map((message, index) => (
          <span className="message-ticker__message" key={index}>
            {message}
          </span>
        ))}
        {/* render second set with offset to ensure seemless infinite animation */}
        {repeatedMessages.map((message, index) => (
          <span
            className="message-ticker__message message-ticker__message--offset"
            key={index}
          >
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}

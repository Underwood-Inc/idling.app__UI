'use client';
import { useEffect, useState } from 'react';
import { MessageTicker } from './MessageTicker';
import { fetchBuddha } from './actions';

export default function MessageTickerWithInterval() {
  const [message, setMessage] = useState<string[]>([]);

  useEffect(() => {
    // Generate random interval between 10-20 minutes (600000-1200000 ms)
    const getRandomInterval = () => {
      const minInterval = 10 * 60 * 1000; // 10 minutes in milliseconds
      const maxInterval = 20 * 60 * 1000; // 20 minutes in milliseconds
      return (
        Math.floor(Math.random() * (maxInterval - minInterval + 1)) +
        minInterval
      );
    };

    const fetchData = () => {
      fetchBuddha()
        .then((result) => {
          if (result?.text) {
            setMessage([result.text]);
          }
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
        });
    };

    fetchData(); // Initial fetch

    // Set up interval with random timing
    const setupInterval = () => {
      const randomInterval = getRandomInterval();

      return setTimeout(() => {
        fetchData();
        // Set up next interval after this one completes
        intervalRef.current = setupInterval();
      }, randomInterval);
    };

    const intervalRef = { current: setupInterval() };

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  return (
    <>
      {message ? <MessageTicker messages={message} /> : <span>Loading...</span>}
    </>
  );
}

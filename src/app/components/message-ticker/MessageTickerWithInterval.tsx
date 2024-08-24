'use client';
import { useEffect, useState } from 'react';
import { MessageTicker } from './MessageTicker';
import { fetchBuddha } from './actions';

export default function MessageTickerWithInterval() {
  const [message, setMessage] = useState<string[]>([]);

  useEffect(() => {
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

    const intervalId = setInterval(fetchData, 108000); // Fetch data every 108 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  return (
    <>
      {message ? <MessageTicker messages={message} /> : <span>Loading...</span>}
    </>
  );
}

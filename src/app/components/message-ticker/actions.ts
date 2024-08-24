'use server';

export interface BuddhaQuoteResponse {
  id: string;
  text: string;
  byId: string;
  byName: string;
  byImage: string;
}

export async function fetchBuddha(): Promise<BuddhaQuoteResponse | null> {
  const res: Response = await fetch('https://buddha-api.com/api/random', {
    cache: 'no-cache'
  });

  if (!res.ok) {
    console.error('Failed to fetch messages');
    return null;
  }

  return res.json();
}

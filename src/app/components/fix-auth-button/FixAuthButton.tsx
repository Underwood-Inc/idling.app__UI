'use client';

import { useState } from 'react';

export default function FixAuthButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleFixAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fix-auth', {
        method: 'POST'
      });

      if (response.ok) {
        // Redirect to sign in page
        window.location.href = '/auth/signin';
      } else {
        console.error('Failed to fix auth');
        alert(
          'Failed to fix authentication. Please try signing out and back in manually.'
        );
      }
    } catch (error) {
      console.error('Error fixing auth:', error);
      alert('Error occurred. Please try signing out and back in manually.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFixAuth}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {isLoading ? 'Fixing...' : 'Fix Avatar Issue (Sign Out & Back In)'}
    </button>
  );
}

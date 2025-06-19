// Clear Service Worker Cache Script
// Run this in browser console or include it to clear all caches

(async function clearAllCaches() {
  console.log('🧹 Clearing all caches...');
  
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log('✅ Service worker unregistered');
      }
    }

    // Clear all cache storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log(`🗑️ Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
      console.log('✅ All cache storage cleared');
    }

    // Clear localStorage
    localStorage.clear();
    console.log('✅ localStorage cleared');

    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');

    // Clear IndexedDB (if any)
    if ('indexedDB' in window) {
      // This is more complex and app-specific, but we'll try a basic approach
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name);
                deleteReq.onsuccess = () => {
                  console.log(`✅ IndexedDB ${db.name} cleared`);
                  resolve();
                };
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      } catch (e) {
        console.log('ℹ️ IndexedDB clearing not supported or no databases found');
      }
    }

    console.log('🎉 All caches cleared! Refreshing page...');
    
    // Force hard refresh
    window.location.reload(true);
    
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    // Fallback: hard refresh anyway
    window.location.reload(true);
  }
})();

// Export for manual use
window.clearAllCaches = clearAllCaches; 
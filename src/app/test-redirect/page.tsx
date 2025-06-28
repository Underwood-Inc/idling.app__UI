'use client';

export default function TestRedirect() {
  const testRedirect = () => {
    // This should redirect to /og-image-viewer when accessed from a browser
    window.open('/api/og-image?seed=test-123', '_blank');
  };

  const testDirect = () => {
    // This should show the image directly
    window.open('/api/og-image?seed=test-123&direct=true', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Test OG Image Redirect
        </h1>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Browser Redirect Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This should redirect to the OG Image Viewer page:
            </p>
            <button
              onClick={testRedirect}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Redirect: /api/og-image
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Direct API Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This should show the image directly (bypassing redirect):
            </p>
            <button
              onClick={testDirect}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Direct: /api/og-image?direct=true
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Manual Links
            </h2>
            <div className="space-y-2">
              <div>
                <a
                  href="/api/og-image?seed=test-123"
                  target="_blank"
                  className="text-blue-500 hover:text-blue-600 underline"
                >
                  /api/og-image?seed=test-123 (should redirect)
                </a>
              </div>
              <div>
                <a
                  href="/api/og-image?seed=test-123&direct=true"
                  target="_blank"
                  className="text-green-500 hover:text-green-600 underline"
                >
                  /api/og-image?seed=test-123&direct=true (direct)
                </a>
              </div>
              <div>
                <a
                  href="/og-image-viewer?seed=test-123"
                  target="_blank"
                  className="text-purple-500 hover:text-purple-600 underline"
                >
                  /og-image-viewer?seed=test-123 (viewer directly)
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

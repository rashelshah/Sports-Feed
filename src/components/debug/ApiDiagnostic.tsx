import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function ApiDiagnostic() {
  const [results, setResults] = useState<{
    apiUrl: string;
    healthCheck: { status: string; error?: string };
    followEndpoint: { status: string; error?: string };
  }>({
    apiUrl: API_URL,
    healthCheck: { status: 'checking' },
    followEndpoint: { status: 'checking' },
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      // Check health endpoint
      try {
        const healthRes = await fetch(`${API_URL.replace('/api', '')}/health`);
        if (healthRes.ok) {
          setResults((r) => ({ ...r, healthCheck: { status: 'ok' } }));
        } else {
          setResults((r) => ({ 
            ...r, 
            healthCheck: { status: 'failed', error: `Status ${healthRes.status}` } 
          }));
        }
      } catch (err: any) {
        setResults((r) => ({ 
          ...r, 
          healthCheck: { status: 'error', error: err.message } 
        }));
      }

      // Check follow endpoint (OPTIONS request to avoid auth)
      try {
        const followRes = await fetch(`${API_URL}/users/follow`, { 
          method: 'OPTIONS',
          headers: { 'Content-Type': 'application/json' }
        });
        if (followRes.status === 204 || followRes.status === 200 || followRes.status === 404) {
          // 404 is expected since OPTIONS might not be supported, but server is reachable
          setResults((r) => ({ ...r, followEndpoint: { status: 'reachable' } }));
        } else {
          setResults((r) => ({ 
            ...r, 
            followEndpoint: { status: 'failed', error: `Status ${followRes.status}` } 
          }));
        }
      } catch (err: any) {
        setResults((r) => ({ 
          ...r, 
          followEndpoint: { status: 'error', error: err.message } 
        }));
      }
    };

    runDiagnostics();
  }, []);

  const isHealthy = results.healthCheck.status === 'ok';
  const isReachable = results.followEndpoint.status === 'reachable';

  return (
    <div className="p-4 bg-gray-100 rounded-lg max-w-md mx-auto mt-4">
      <h3 className="font-bold mb-2">API Diagnostic</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">API URL:</span> {results.apiUrl}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Health Check:</span>
          {results.healthCheck.status === 'checking' && (
            <span className="text-yellow-600">Checking...</span>
          )}
          {results.healthCheck.status === 'ok' && (
            <span className="text-green-600">✓ Backend is running</span>
          )}
          {(results.healthCheck.status === 'failed' || results.healthCheck.status === 'error') && (
            <span className="text-red-600">✗ {results.healthCheck.error}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">Follow Endpoint:</span>
          {results.followEndpoint.status === 'checking' && (
            <span className="text-yellow-600">Checking...</span>
          )}
          {results.followEndpoint.status === 'reachable' && (
            <span className="text-green-600">✓ Reachable</span>
          )}
          {(results.followEndpoint.status === 'failed' || results.followEndpoint.status === 'error') && (
            <span className="text-red-600">✗ {results.followEndpoint.error}</span>
          )}
        </div>
      </div>

      {!isHealthy && (
        <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded">
          <p className="font-medium">Backend not detected!</p>
          <p>Make sure your backend is running on port 3000:</p>
          <code className="block bg-gray-800 text-white p-1 mt-1 rounded">
            cd backend && npm run dev
          </code>
        </div>
      )}

      {isHealthy && !isReachable && (
        <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded">
          <p>Backend is running but follow endpoint may have issues.</p>
          <p>Check if users routes are properly registered.</p>
        </div>
      )}
    </div>
  );
}

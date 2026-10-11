'use client';

import { useState } from 'react';

export default function TestWebhookPage() {
  const [reference, setReference] = useState('VB-MV3RZ0WU-J9FY0D');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/paynow/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          reference: reference,
          paynowreference: 'TEST-' + Date.now(),
          amount: '15.00',
          status: 'Paid',
          pollurl: 'https://www.paynow.co.zw/test',
        }).toString(),
      });

      const text = await response.text();
      setResult({
        status: response.status,
        body: text,
        success: response.ok,
      });
    } catch (error) {
      setResult({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Webhook Test</h1>
        <p className="text-sm text-gray-600 mb-4">
          Simulate a Paynow webhook notification for testing.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          onClick={sendTest}
          disabled={loading}
          className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium disabled:opacity-50"
          style={{ backgroundColor: '#F47B20' }}
        >
          {loading ? 'Sending...' : 'Send Test Webhook'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium mb-2">Result:</p>
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
          }

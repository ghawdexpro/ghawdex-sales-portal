'use client';

/**
 * Avatar Session Resume Page
 *
 * Handles resuming paused avatar chat sessions via resume token.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ResumeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = params.token as string;

    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid resume link');
      return;
    }

    // Validate session and redirect to avatar chat
    validateAndRedirect(token);
  }, [params.token]);

  const validateAndRedirect = async (token: string) => {
    try {
      // Check if session exists and is resumable
      const response = await fetch(`/api/avatar/session?token=${token}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Session not found');
      }

      const session = data.session;

      // Check session status
      if (session.status === 'completed') {
        setStatus('error');
        setErrorMessage('This consultation has already been completed.');
        return;
      }

      if (session.status === 'abandoned') {
        setStatus('error');
        setErrorMessage('This session has expired. Please start a new consultation.');
        return;
      }

      // Session is valid - redirect to avatar chat with token
      setStatus('success');

      // Short delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000));

      router.push(`/avatar?token=${token}`);
    } catch (error) {
      console.error('Resume validation error:', error);
      setStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to resume session. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Logo */}
        <img
          src="/logo/Ghawdex engineering logo.svg"
          alt="GhawdeX"
          className="h-12 mx-auto mb-6"
        />

        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Resuming Your Consultation
            </h1>
            <p className="text-gray-600">
              Just a moment while we reconnect your session...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Session Found!
            </h1>
            <p className="text-gray-600">
              Redirecting you to continue your consultation...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Unable to Resume
            </h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/avatar')}
                className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
              >
                Start New Consultation
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Go to Homepage
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

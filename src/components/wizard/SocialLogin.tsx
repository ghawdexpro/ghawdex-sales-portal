'use client';

import { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { useWizard } from './WizardContext';

// Types for Google Identity Services
interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

// Types for Facebook SDK
interface FacebookStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    userID: string;
  };
}

interface FacebookUserResponse {
  name: string;
  email: string;
  id: string;
}

// Declare global types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              width?: number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
    FB?: {
      init: (config: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (callback: (response: FacebookStatusResponse) => void, options: { scope: string }) => void;
      api: (path: string, callback: (response: FacebookUserResponse) => void) => void;
      getLoginStatus: (callback: (response: FacebookStatusResponse) => void) => void;
    };
    fbAsyncInit?: () => void;
  }
}

interface SocialLoginProps {
  onLogin: (data: { name: string; email: string; provider: 'google' | 'facebook' }) => void;
  onError?: (error: string) => void;
}

export default function SocialLogin({ onLogin, onError }: SocialLoginProps) {
  const { state } = useWizard();
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [facebookLoaded, setFacebookLoaded] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingFacebook, setIsLoadingFacebook] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  // Decode JWT token from Google
  const decodeGoogleToken = (token: string): GoogleUser | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  // Handle Google callback
  const handleGoogleCallback = useCallback((response: GoogleCredentialResponse) => {
    setIsLoadingGoogle(true);
    setError(null);

    const user = decodeGoogleToken(response.credential);
    if (user && user.email) {
      onLogin({
        name: user.name || '',
        email: user.email,
        provider: 'google',
      });
    } else {
      const errorMsg = 'Failed to get user info from Google';
      setError(errorMsg);
      onError?.(errorMsg);
    }
    setIsLoadingGoogle(false);
  }, [onLogin, onError]);

  // Initialize Google Identity Services
  useEffect(() => {
    if (googleLoaded && googleClientId && window.google) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
        auto_select: false,
      });

      const googleBtn = document.getElementById('google-signin-btn');
      if (googleBtn) {
        window.google.accounts.id.renderButton(googleBtn, {
          theme: 'filled_black',
          size: 'large',
          type: 'standard',
          text: 'continue_with',
          width: 280,
        });
      }
    }
  }, [googleLoaded, googleClientId, handleGoogleCallback]);

  // Initialize Facebook SDK
  useEffect(() => {
    if (facebookAppId) {
      window.fbAsyncInit = function () {
        window.FB?.init({
          appId: facebookAppId,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
        });
        setFacebookLoaded(true);
      };
    }
  }, [facebookAppId]);

  // Handle Facebook login
  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded');
      return;
    }

    setIsLoadingFacebook(true);
    setError(null);

    window.FB.login(
      (response) => {
        if (response.status === 'connected') {
          // Get user profile
          window.FB?.api('/me?fields=name,email', (userResponse) => {
            if (userResponse.email) {
              onLogin({
                name: userResponse.name || '',
                email: userResponse.email,
                provider: 'facebook',
              });
            } else {
              const errorMsg = 'Email not provided. Please allow email access.';
              setError(errorMsg);
              onError?.(errorMsg);
            }
            setIsLoadingFacebook(false);
          });
        } else {
          setIsLoadingFacebook(false);
        }
      },
      { scope: 'public_profile,email' }
    );
  };

  // If already logged in via social
  if (state.isSocialLogin && state.email) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-white font-medium text-sm">Signed in as</div>
            <div className="text-green-400 text-xs">{state.email}</div>
          </div>
        </div>
      </div>
    );
  }

  // Check if SDKs are configured
  const hasGoogle = !!googleClientId;
  const hasFacebook = !!facebookAppId;

  if (!hasGoogle && !hasFacebook) {
    return null; // Don't show social login if not configured
  }

  return (
    <div className="mb-6">
      {/* Load Google SDK */}
      {hasGoogle && (
        <Script
          src="https://accounts.google.com/gsi/client"
          onLoad={() => setGoogleLoaded(true)}
          strategy="lazyOnload"
        />
      )}

      {/* Load Facebook SDK */}
      {hasFacebook && (
        <Script
          src="https://connect.facebook.net/en_US/sdk.js"
          onLoad={() => {
            if (window.fbAsyncInit) window.fbAsyncInit();
          }}
          strategy="lazyOnload"
        />
      )}

      {/* Highlighted box for quick sign-in */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="text-green-400 font-medium text-sm">Fastest way to continue</div>
            <div className="text-gray-300 text-xs">Auto-fill your name & email in 1 click</div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Google Sign-In Button */}
          {hasGoogle && (
            <div className="flex justify-center min-h-[50px] items-center overflow-hidden">
              {googleLoaded ? (
                <div id="google-signin-btn" className="flex justify-center" />
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-gray-400"
                >
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Loading Google...</span>
                </button>
              )}
            </div>
          )}

          {/* Facebook Login Button */}
          {hasFacebook && (
            <div className="flex justify-center">
              <button
                onClick={handleFacebookLogin}
                disabled={!facebookLoaded || isLoadingFacebook}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-3 px-4 text-white font-medium transition-colors"
              >
                {isLoadingFacebook ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
                <span>Continue with Facebook</span>
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 text-center text-red-400 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-500">or enter manually below</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
    </div>
  );
}

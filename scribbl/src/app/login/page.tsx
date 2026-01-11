'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  DoodleCircle,
  DoodleRect,
  DoodleStar,
  SquigglyLine,
  DoodleArrow,
  HandDrawnUnderline,
} from '@/components/ui/Decorations';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirectTo);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-virgil text-gray-900 mb-2">
          Sign in to your account
        </h2>
        <p className="text-gray-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign up for free
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 font-medium transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <DoodleArrow size={20} color="#fff" direction="right" />
            </>
          )}
        </button>
      </form>

      {/* Trust indicators */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure login</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Privacy first</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 animate-float-slow opacity-30">
          <DoodleCircle size={60} color="#fff" strokeColor="#fff" />
        </div>
        <div className="absolute top-40 right-20 animate-float opacity-20">
          <DoodleRect width={80} height={50} color="#fff" strokeColor="#fff" rotation={-15} />
        </div>
        <div className="absolute bottom-32 left-16 animate-wiggle opacity-25">
          <SquigglyLine width={100} color="#fff" />
        </div>
        <div className="absolute bottom-20 right-32 animate-float-fast opacity-30">
          <DoodleStar size={30} color="#fbbf24" />
        </div>
        <div className="absolute top-1/3 right-10 animate-float opacity-20">
          <DoodleCircle size={40} color="#fff" strokeColor="#fff" />
        </div>
        <div className="absolute bottom-1/3 left-1/4 animate-float-slow opacity-15">
          <DoodleRect width={50} height={50} color="#fff" strokeColor="#fff" rotation={10} />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center px-12 xl:px-20 relative z-10">
          <Link href="/" className="mb-12">
            <span className="text-4xl font-virgil text-white">Scribbl</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-virgil text-white mb-6 leading-tight">
            Welcome back!
            <br />
            <span className="relative inline-block mt-2">
              Your ideas await
              <HandDrawnUnderline width={220} color="rgba(255,255,255,0.4)" className="absolute -bottom-1 left-0" />
            </span>
          </h1>

          <p className="text-indigo-100 text-lg mb-12 max-w-md">
            Pick up right where you left off. Your drawings are safe in the cloud, waiting for you.
          </p>

          {/* Benefits */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Auto-saved to the cloud</h3>
                <p className="text-indigo-200 text-sm">Never lose your work again. Every stroke is saved automatically.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Access from any device</h3>
                <p className="text-indigo-200 text-sm">Start on your laptop, continue on your tablet. Your drawings sync everywhere.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Easy sharing</h3>
                <p className="text-indigo-200 text-sm">Share your sketches with anyone using a simple link.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-gray-50 relative">
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-6">
          <Link href="/">
            <span className="text-2xl font-virgil bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Scribbl
            </span>
          </Link>
        </div>

        {/* Decorative elements for mobile/tablet */}
        <div className="absolute top-20 right-8 animate-float-slow opacity-40 lg:opacity-20">
          <DoodleCircle size={30} color="#c7d2fe" strokeColor="#a5b4fc" />
        </div>
        <div className="absolute bottom-20 left-8 animate-float opacity-30 lg:opacity-15">
          <DoodleStar size={24} color="#fbbf24" />
        </div>

        <Suspense fallback={<div className="w-full max-w-md mx-auto animate-pulse">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

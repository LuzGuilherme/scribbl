'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  DoodleCircle,
  DoodleRect,
  DoodleStar,
  SquigglyLine,
  DoodleArrow,
  HandDrawnUnderline,
} from '@/components/ui/Decorations';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 animate-float-slow opacity-20">
          <DoodleCircle size={60} color="#fff" strokeColor="#fff" />
        </div>
        <div className="absolute bottom-20 right-20 animate-float opacity-20">
          <DoodleRect width={80} height={50} color="#fff" strokeColor="#fff" rotation={-15} />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float-fast opacity-30">
          <DoodleStar size={30} color="#fbbf24" />
        </div>

        <div className="max-w-md w-full">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-10 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-virgil text-gray-900 mb-3">Check your email!</h2>
            <p className="text-gray-500 mb-6">
              We sent a confirmation link to{' '}
              <strong className="text-gray-700">{email}</strong>.
              <br />
              Click the link to activate your account.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Start sketching
            <br />
            <span className="relative inline-block mt-2">
              beautiful ideas
              <HandDrawnUnderline width={200} color="rgba(255,255,255,0.4)" className="absolute -bottom-1 left-0" />
            </span>
          </h1>

          <p className="text-indigo-100 text-lg mb-12 max-w-md">
            Join thousands of makers, designers, and teams who use Scribbl to bring their ideas to life.
          </p>

          {/* Benefits */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Set up in seconds</h3>
                <p className="text-indigo-200 text-sm">No credit card required. Start drawing immediately after sign up.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Free forever for personal use</h3>
                <p className="text-indigo-200 text-sm">Create unlimited drawings. No hidden fees or surprise charges.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Hand-drawn style that stands out</h3>
                <p className="text-indigo-200 text-sm">Your diagrams will look human, not like every other corporate tool.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
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

        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-virgil text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <DoodleArrow size={20} color="#fff" direction="right" />
                </>
              )}
            </button>
          </form>

          {/* Trust indicators & Terms */}
          <div className="mt-8 space-y-4">
            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <span className="text-gray-700">Terms of Service</span> and{' '}
              <span className="text-gray-700">Privacy Policy</span>.
            </p>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-400 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Free forever</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

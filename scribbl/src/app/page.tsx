'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomepageDecorations,
  CanvasMockup,
  FeatureIcon,
  HandDrawnUnderline,
  DoodleArrow,
  DoodleStar,
  PencilIllustration,
} from '@/components/ui/Decorations';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-gradient">
        <div className="text-gray-500 font-virgil text-xl animate-pulse-soft">Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-gradient">
        <div className="text-gray-500 font-virgil text-xl animate-pulse-soft">Redirecting to dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-gradient relative overflow-x-hidden">
      {/* Background decorations */}
      <HomepageDecorations />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-virgil bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Scribbl
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="btn-soft px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 font-medium transition-all shadow-md shadow-indigo-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-16 relative z-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Small badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200/50 mb-8">
              <DoodleStar size={16} color="#fbbf24" />
              <span className="text-sm text-gray-600">Free and open-source</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-virgil text-gray-900 mb-6 leading-tight">
              Sketch ideas that
              <br />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  actually look good
                </span>
                <HandDrawnUnderline
                  width={300}
                  color="#c7d2fe"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Stop fighting with clunky diagram tools. Scribbl gives you a beautiful hand-drawn canvas
              that makes even quick sketches look professional. Your drawings auto-save to the cloud.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="btn-soft group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-600 font-semibold text-lg transition-all shadow-lg shadow-indigo-200"
              >
                Start Drawing Free
                <DoodleArrow size={24} color="#fff" direction="right" className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="btn-soft px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-600 rounded-2xl border border-gray-200 hover:bg-white hover:border-gray-300 font-semibold text-lg transition-all"
              >
                Sign In
              </Link>
            </div>

            <p className="text-sm text-gray-400 mt-4">No credit card required</p>
          </div>

          {/* Canvas Preview */}
          <div className="mt-16 sm:mt-20 relative">
            <div className="absolute -top-8 -left-4 animate-float-slow opacity-60 hidden lg:block">
              <PencilIllustration size={80} />
            </div>
            <CanvasMockup className="max-w-4xl mx-auto" />
          </div>
        </div>

        {/* Social proof */}
        <div className="py-12 bg-white/40 backdrop-blur-sm border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400 text-sm mb-4">Trusted by makers, designers, and teams</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-40">
              <div className="font-virgil text-2xl text-gray-400">Indie Hackers</div>
              <div className="font-virgil text-2xl text-gray-400">Startups</div>
              <div className="font-virgil text-2xl text-gray-400">Remote Teams</div>
              <div className="font-virgil text-2xl text-gray-400">Educators</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 sm:py-28 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-virgil text-gray-900 mb-4">
                Everything you need to sketch your ideas
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Simple tools, beautiful results. No learning curve required.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Feature 1: Hand-drawn style */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 p-8 card-hover">
                <FeatureIcon color="indigo" className="mb-6 w-[72px] h-[72px]">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </FeatureIcon>
                <h3 className="text-xl font-virgil text-gray-900 mb-3">
                  Hand-drawn, not corporate
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  <strong className="text-gray-700">The problem:</strong> Most diagram tools make everything look like a boring corporate presentation.
                </p>
                <p className="text-gray-500 leading-relaxed mt-3">
                  <strong className="text-gray-700">What you get:</strong> Sketchy shapes that feel human. Perfect for brainstorms, quick notes, and presentations that don't put people to sleep.
                </p>
              </div>

              {/* Feature 2: Auto-save cloud */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 p-8 card-hover">
                <FeatureIcon color="purple" className="mb-6 w-[72px] h-[72px]">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </FeatureIcon>
                <h3 className="text-xl font-virgil text-gray-900 mb-3">
                  Never lose your work again
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  <strong className="text-gray-700">The problem:</strong> You've spent an hour on a diagram and Chrome crashes. Everything's gone.
                </p>
                <p className="text-gray-500 leading-relaxed mt-3">
                  <strong className="text-gray-700">What you get:</strong> Auto-save every few seconds. Open any device, pick up where you left off. Zero data loss anxiety.
                </p>
              </div>

              {/* Feature 3: Easy sharing */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 p-8 card-hover">
                <FeatureIcon color="green" className="mb-6 w-[72px] h-[72px]">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </FeatureIcon>
                <h3 className="text-xl font-virgil text-gray-900 mb-3">
                  Share with one click
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  <strong className="text-gray-700">The problem:</strong> Exporting PNGs, uploading to Slack, explaining where to find the latest version... it's tedious.
                </p>
                <p className="text-gray-500 leading-relaxed mt-3">
                  <strong className="text-gray-700">What you get:</strong> Generate a shareable link in one click. Anyone can view it, no account needed. Always shows the latest version.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* More features list */}
        <div className="py-16 bg-white/40 backdrop-blur-sm border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-virgil text-gray-900 mb-4">
                All the tools you'd expect
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '⬜', title: 'Shapes', desc: 'Rectangles, ellipses, diamonds, and more' },
                { icon: '✏️', title: 'Freehand', desc: 'Draw anything with your mouse or pen' },
                { icon: '➡️', title: 'Arrows & Lines', desc: 'Connect ideas with various line styles' },
                { icon: '📝', title: 'Text', desc: 'Add labels with the hand-drawn Virgil font' },
                { icon: '🎨', title: 'Colors', desc: 'Customize fill and stroke colors' },
                { icon: '📁', title: 'Folders', desc: 'Organize drawings into folders' },
                { icon: '📤', title: 'Export PNG', desc: 'Download high-quality images' },
                { icon: '🔒', title: 'Private by default', desc: 'Your drawings are yours' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white/50 rounded-xl">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 sm:py-28 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-10 sm:p-16 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 opacity-20">
                <DoodleStar size={40} color="#fff" />
              </div>
              <div className="absolute bottom-4 right-4 opacity-20">
                <DoodleStar size={30} color="#fff" />
              </div>
              <div className="absolute top-1/2 right-8 opacity-10 hidden sm:block">
                <PencilIllustration size={100} />
              </div>

              <h2 className="text-3xl sm:text-4xl font-virgil text-white mb-4 relative z-10">
                Ready to sketch your next idea?
              </h2>
              <p className="text-indigo-100 mb-8 text-lg max-w-xl mx-auto relative z-10">
                Join thousands of makers who use Scribbl for brainstorms, diagrams, and presentations.
              </p>
              <Link
                href="/signup"
                className="btn-soft inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-2xl hover:bg-gray-50 font-semibold text-lg transition-all shadow-lg relative z-10"
              >
                Get Started Free
                <DoodleArrow size={24} color="#4f46e5" direction="right" />
              </Link>
              <p className="text-indigo-200 text-sm mt-4 relative z-10">
                No credit card required. Free forever for personal use.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 bg-white/60 backdrop-blur-sm border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xl font-virgil bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  Scribbl
                </span>
                <span className="text-gray-400 text-sm">
                  &copy; {new Date().getFullYear()}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <Link href="/login" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

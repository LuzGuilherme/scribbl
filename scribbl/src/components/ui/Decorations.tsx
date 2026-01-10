'use client';

import React from 'react';

// Doodle circle with hand-drawn effect
export function DoodleCircle({
  className = '',
  size = 40,
  color = '#c7d2fe',
  strokeColor = '#a5b4fc',
  filled = true
}: {
  className?: string;
  size?: number;
  color?: string;
  strokeColor?: string;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      style={{ overflow: 'visible' }}
    >
      <circle
        cx="20"
        cy="20"
        r="16"
        fill={filled ? color : 'none'}
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray="2 1"
      />
    </svg>
  );
}

// Doodle rectangle with rounded corners
export function DoodleRect({
  className = '',
  width = 60,
  height = 40,
  color = '#fde68a',
  strokeColor = '#fbbf24',
  filled = true,
  rotation = 0
}: {
  className?: string;
  width?: number;
  height?: number;
  color?: string;
  strokeColor?: string;
  filled?: boolean;
  rotation?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: 'visible', transform: `rotate(${rotation}deg)` }}
    >
      <rect
        x="4"
        y="4"
        width={width - 8}
        height={height - 8}
        rx="4"
        fill={filled ? color : 'none'}
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray="4 2"
      />
    </svg>
  );
}

// Squiggly line decoration
export function SquigglyLine({
  className = '',
  width = 100,
  color = '#d1d5db'
}: {
  className?: string;
  width?: number;
  color?: string;
}) {
  return (
    <svg
      width={width}
      height="20"
      viewBox={`0 0 ${width} 20`}
      className={className}
    >
      <path
        d={`M0 10 Q ${width/6} 2, ${width/3} 10 T ${width*2/3} 10 T ${width} 10`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Small star decoration
export function DoodleStar({
  className = '',
  size = 24,
  color = '#fbbf24'
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        d="M12 2L14.5 9L22 9L16 14L18.5 22L12 17L5.5 22L8 14L2 9L9.5 9L12 2Z"
        fill={color}
        stroke={color}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Small dots pattern
export function DotPattern({
  className = '',
  rows = 3,
  cols = 3,
  color = '#e5e7eb',
  spacing = 8
}: {
  className?: string;
  rows?: number;
  cols?: number;
  color?: string;
  spacing?: number;
}) {
  const width = cols * spacing;
  const height = rows * spacing;
  const dots = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      dots.push(
        <circle
          key={`${i}-${j}`}
          cx={j * spacing + spacing/2}
          cy={i * spacing + spacing/2}
          r="2"
          fill={color}
        />
      );
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {dots}
    </svg>
  );
}

// Arrow doodle
export function DoodleArrow({
  className = '',
  size = 40,
  color = '#9ca3af',
  direction = 'right'
}: {
  className?: string;
  size?: number;
  color?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}) {
  const rotations = {
    up: -90,
    down: 90,
    left: 180,
    right: 0
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      style={{ transform: `rotate(${rotations[direction]}deg)` }}
    >
      <path
        d="M8 20 L28 20 M22 14 L28 20 L22 26"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Pencil illustration (like Excalidraw)
export function PencilIllustration({
  className = '',
  size = 120
}: {
  className?: string;
  size?: number;
}) {
  const scale = size / 120;

  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 120 180"
      className={className}
    >
      {/* Pencil body */}
      <rect
        x="45"
        y="20"
        width="30"
        height="120"
        rx="4"
        fill="#6b7280"
        stroke="#4b5563"
        strokeWidth="2"
      />
      {/* Pencil tip */}
      <polygon
        points="45,140 75,140 60,170"
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth="2"
      />
      {/* Pencil top band */}
      <rect
        x="45"
        y="20"
        width="30"
        height="15"
        rx="4"
        fill="#9ca3af"
        stroke="#6b7280"
        strokeWidth="1"
      />
      {/* Eraser */}
      <ellipse
        cx="60"
        cy="15"
        rx="12"
        ry="8"
        fill="#f9a8d4"
        stroke="#ec4899"
        strokeWidth="1"
      />
    </svg>
  );
}

// Combined decorations for dashboard background
export function DashboardDecorations() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top left decorations */}
      <div className="absolute top-20 left-10 animate-float-slow opacity-60">
        <DoodleCircle size={30} color="#ddd6fe" strokeColor="#c4b5fd" />
      </div>
      <div className="absolute top-40 left-32 animate-float opacity-40">
        <DoodleRect width={50} height={30} color="#fef3c7" strokeColor="#fcd34d" rotation={-15} />
      </div>

      {/* Top right decorations */}
      <div className="absolute top-24 right-20 animate-float-fast opacity-50">
        <DoodleStar size={20} color="#fcd34d" />
      </div>
      <div className="absolute top-48 right-40 animate-wiggle opacity-40">
        <SquigglyLine width={60} color="#c7d2fe" />
      </div>
      <div className="absolute top-32 right-60 animate-float-slow opacity-30">
        <DotPattern rows={3} cols={3} color="#d1d5db" />
      </div>

      {/* Middle left */}
      <div className="absolute top-1/3 left-8 animate-float opacity-30">
        <DoodleRect width={40} height={40} color="#dcfce7" strokeColor="#86efac" rotation={10} />
      </div>

      {/* Middle right */}
      <div className="absolute top-1/2 right-12 animate-float-slow opacity-40">
        <DoodleCircle size={45} color="#fce7f3" strokeColor="#f9a8d4" />
      </div>

      {/* Bottom left */}
      <div className="absolute bottom-32 left-20 animate-wiggle opacity-40">
        <DoodleArrow size={30} color="#a5b4fc" direction="up" />
      </div>
      <div className="absolute bottom-48 left-8 animate-float opacity-30">
        <DotPattern rows={2} cols={4} color="#e5e7eb" />
      </div>

      {/* Bottom right */}
      <div className="absolute bottom-24 right-32 animate-float-fast opacity-50">
        <DoodleStar size={16} color="#a5b4fc" />
      </div>
      <div className="absolute bottom-40 right-16 animate-float-slow opacity-40">
        <SquigglyLine width={80} color="#fde68a" />
      </div>

      {/* Extra scattered elements */}
      <div className="absolute top-2/3 left-1/4 animate-float opacity-20">
        <DoodleCircle size={20} color="#e0f2fe" strokeColor="#7dd3fc" />
      </div>
      <div className="absolute top-1/4 left-1/2 animate-wiggle opacity-25">
        <DoodleRect width={35} height={25} color="#f3e8ff" strokeColor="#d8b4fe" rotation={-8} />
      </div>
    </div>
  );
}

// Homepage hero decorations with more elements
export function HomepageDecorations() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top left area */}
      <div className="absolute top-24 left-[5%] animate-float-slow opacity-50">
        <DoodleCircle size={50} color="#ddd6fe" strokeColor="#c4b5fd" />
      </div>
      <div className="absolute top-40 left-[15%] animate-float opacity-40">
        <DoodleRect width={70} height={45} color="#fef3c7" strokeColor="#fcd34d" rotation={-12} />
      </div>
      <div className="absolute top-[30%] left-[8%] animate-wiggle opacity-35">
        <SquigglyLine width={80} color="#c7d2fe" />
      </div>

      {/* Top right area */}
      <div className="absolute top-28 right-[8%] animate-float-fast opacity-50">
        <DoodleStar size={28} color="#fcd34d" />
      </div>
      <div className="absolute top-52 right-[15%] animate-float opacity-45">
        <DoodleCircle size={35} color="#fce7f3" strokeColor="#f9a8d4" />
      </div>
      <div className="absolute top-36 right-[25%] animate-float-slow opacity-30">
        <DotPattern rows={4} cols={4} color="#d1d5db" spacing={10} />
      </div>

      {/* Middle left */}
      <div className="absolute top-[45%] left-[3%] animate-float opacity-35">
        <DoodleRect width={55} height={55} color="#dcfce7" strokeColor="#86efac" rotation={8} />
      </div>
      <div className="absolute top-[55%] left-[12%] animate-float-fast opacity-40">
        <DoodleStar size={18} color="#a5b4fc" />
      </div>

      {/* Middle right */}
      <div className="absolute top-[50%] right-[5%] animate-float-slow opacity-40">
        <DoodleCircle size={60} color="#e0f2fe" strokeColor="#7dd3fc" />
      </div>
      <div className="absolute top-[42%] right-[18%] animate-wiggle opacity-35">
        <DoodleArrow size={40} color="#c4b5fd" direction="down" />
      </div>

      {/* Bottom left */}
      <div className="absolute bottom-[25%] left-[10%] animate-wiggle opacity-40">
        <DoodleArrow size={35} color="#86efac" direction="right" />
      </div>
      <div className="absolute bottom-[35%] left-[5%] animate-float opacity-30">
        <DotPattern rows={3} cols={5} color="#e5e7eb" spacing={9} />
      </div>
      <div className="absolute bottom-[15%] left-[18%] animate-float-slow opacity-45">
        <DoodleRect width={40} height={30} color="#fde68a" strokeColor="#fbbf24" rotation={-5} />
      </div>

      {/* Bottom right */}
      <div className="absolute bottom-[20%] right-[8%] animate-float-fast opacity-50">
        <DoodleStar size={22} color="#f9a8d4" />
      </div>
      <div className="absolute bottom-[30%] right-[15%] animate-float-slow opacity-40">
        <SquigglyLine width={100} color="#fde68a" />
      </div>
      <div className="absolute bottom-[40%] right-[3%] animate-float opacity-35">
        <DoodleCircle size={40} color="#f3e8ff" strokeColor="#d8b4fe" />
      </div>

      {/* Center scattered (behind content) */}
      <div className="absolute top-[20%] left-[40%] animate-float opacity-15">
        <DoodleCircle size={25} color="#c7d2fe" strokeColor="#a5b4fc" />
      </div>
      <div className="absolute top-[65%] left-[35%] animate-wiggle opacity-15">
        <DoodleRect width={45} height={35} color="#fce7f3" strokeColor="#f9a8d4" rotation={15} />
      </div>
      <div className="absolute top-[75%] right-[40%] animate-float-slow opacity-15">
        <DoodleStar size={20} color="#fcd34d" />
      </div>
    </div>
  );
}

// Canvas mockup illustration for hero section
export function CanvasMockup({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Browser window frame */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden">
        {/* Window header */}
        <div className="bg-gray-50/80 px-4 py-3 flex items-center gap-3 border-b border-gray-200/50">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-sm text-gray-400 font-virgil">My awesome diagram</span>
          </div>
        </div>

        {/* Canvas area with hand-drawn elements */}
        <div className="aspect-[16/10] bg-white p-8 relative overflow-hidden">
          {/* Hand-drawn rectangle */}
          <svg className="absolute top-12 left-16" width="140" height="80" viewBox="0 0 140 80">
            <rect x="4" y="4" width="132" height="72" rx="4"
              fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3" />
            <text x="70" y="45" textAnchor="middle" className="font-virgil" fontSize="14" fill="#1e40af">
              User Flow
            </text>
          </svg>

          {/* Arrow connecting */}
          <svg className="absolute top-[52px] left-[156px]" width="60" height="30" viewBox="0 0 60 30">
            <path d="M0 15 L45 15 M38 8 L48 15 L38 22"
              fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* Hand-drawn circle */}
          <svg className="absolute top-8 left-[220px]" width="90" height="90" viewBox="0 0 90 90">
            <ellipse cx="45" cy="45" rx="40" ry="38"
              fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" />
            <text x="45" y="50" textAnchor="middle" className="font-virgil" fontSize="13" fill="#92400e">
              Database
            </text>
          </svg>

          {/* Another rectangle */}
          <svg className="absolute top-[120px] left-[180px]" width="130" height="70" viewBox="0 0 130 70">
            <rect x="4" y="4" width="122" height="62" rx="4"
              fill="#dcfce7" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 3" />
            <text x="65" y="40" textAnchor="middle" className="font-virgil" fontSize="13" fill="#15803d">
              API Server
            </text>
          </svg>

          {/* Connecting arrow */}
          <svg className="absolute top-[98px] left-[240px]" width="30" height="30" viewBox="0 0 30 30">
            <path d="M15 0 L15 22 M8 15 L15 25 L22 15"
              fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* Small diamond */}
          <svg className="absolute bottom-16 left-12" width="60" height="60" viewBox="0 0 60 60">
            <polygon points="30,5 55,30 30,55 5,30"
              fill="#fce7f3" stroke="#ec4899" strokeWidth="2" strokeDasharray="4 2" />
            <text x="30" y="34" textAnchor="middle" className="font-virgil" fontSize="10" fill="#be185d">
              Check
            </text>
          </svg>

          {/* Free-hand squiggle */}
          <svg className="absolute bottom-8 right-8" width="80" height="20" viewBox="0 0 80 20">
            <path d="M5 10 Q 20 2, 35 10 T 65 10 T 75 10"
              fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* Cursor icon */}
          <svg className="absolute top-[85px] left-[280px] animate-pulse-soft" width="20" height="24" viewBox="0 0 20 24">
            <path d="M4 0 L4 18 L8 14 L12 22 L14 21 L10 13 L16 13 Z"
              fill="#1e1e1e" stroke="#fff" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Feature icon wrapper with doodle border
export function FeatureIcon({
  children,
  color = 'indigo',
  className = ''
}: {
  children: React.ReactNode;
  color?: 'indigo' | 'purple' | 'green' | 'yellow' | 'pink' | 'blue';
  className?: string;
}) {
  const colors = {
    indigo: { bg: '#eef2ff', stroke: '#a5b4fc', icon: '#6366f1' },
    purple: { bg: '#faf5ff', stroke: '#d8b4fe', icon: '#a855f7' },
    green: { bg: '#f0fdf4', stroke: '#86efac', icon: '#22c55e' },
    yellow: { bg: '#fefce8', stroke: '#fde047', icon: '#eab308' },
    pink: { bg: '#fdf2f8', stroke: '#f9a8d4', icon: '#ec4899' },
    blue: { bg: '#eff6ff', stroke: '#93c5fd', icon: '#3b82f6' },
  };

  const c = colors[color];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width="72" height="72" viewBox="0 0 72 72" className="absolute">
        <rect x="4" y="4" width="64" height="64" rx="16"
          fill={c.bg} stroke={c.stroke} strokeWidth="2" strokeDasharray="6 4" />
      </svg>
      <div className="relative z-10 w-8 h-8" style={{ color: c.icon }}>
        {children}
      </div>
    </div>
  );
}

// Hand-drawn underline
export function HandDrawnUnderline({
  width = 200,
  color = '#c7d2fe',
  className = ''
}: {
  width?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg width={width} height="12" viewBox={`0 0 ${width} 12`} className={className}>
      <path
        d={`M2 8 Q ${width * 0.25} 3, ${width * 0.5} 7 T ${width - 2} 5`}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default DashboardDecorations;

/**
 * @file Logo.tsx
 * @description Professional logo component for TeamService Costa
 * Uses brand colors: Black, Dark Blue, Yellow
 */

import React from 'react';

interface LogoProps {
  readonly className?: string;
  readonly showText?: boolean;
  readonly theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  showText = true,
  theme = 'light'
}) => {
  // Professional brand colors (matching original logo)
  const primaryColor = theme === 'light' ? '#1a1a1b' : '#ffffff'; // Black/White
  const yellowColor = '#fbbf24'; // Yellow-400
  const darkBlueColor = '#1e3a8a'; // Blue-900 (dark blue from original logo)

  if (!showText) {
    // Icon version - Stylized initials
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          <div 
            className="font-black text-2xl"
            style={{ color: darkBlueColor }}
          >
            TS
          </div>
          <div 
            className="absolute -bottom-1 -right-1 font-black text-xs"
            style={{ color: yellowColor }}
          >
            C
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col leading-none ${className}`}>
      {/* Main brand name */}
      <div className="flex items-baseline gap-1">
        <span 
          className="font-black text-xl tracking-tight"
          style={{ color: primaryColor }}
        >
          TEAM
        </span>
        <span 
          className="font-black text-xl tracking-tight"
          style={{ color: darkBlueColor }}
        >
          SERVICE
        </span>
      </div>
      
      {/* Subtitle with accent */}
      <div className="flex items-center gap-1 mt-0.5">
        <div 
          className="h-0.5 w-6 rounded-full"
          style={{ 
            background: `linear-gradient(90deg, ${yellowColor} 0%, ${darkBlueColor} 100%)`
          }}
        />
        <span 
          className="font-bold text-xs tracking-widest"
          style={{ color: yellowColor }}
        >
          COSTA
        </span>
      </div>
    </div>
  );
};

/**
 * Compact version for collapsed sidebar
 */
export const LogoIcon: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'light' }) => {
  return <Logo showText={false} theme={theme} />;
};

/**
 * @file Logo.tsx
 * @description Professional logo component for TeamService Costa
 * Uses the uploaded brand image.
 */

import React from 'react';
import Image from 'next/image';

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
  // If showText is false, we might want to show a smaller icon or just the same logo but smaller.
  // For now, using the same image as the base.

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Image
        src="/img/logo_new.png"
        alt="Team Service Costa"
        width={300}
        height={85}
        className="object-contain"
        priority
      />
    </div>
  );
};

/**
 * Compact version for collapsed sidebar
 */
export const LogoIcon: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'light' }) => {
  // For the icon only version, we might want to crop it or use the same image but small
  // using a different class or transform if needed.
  // For now, let's return the logo restricted in size via container in parent or just use Logo.
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <Image
        src="/img/logo_new.png"
        alt="TS"
        width={40}
        height={40}
        className="object-contain"
      />
    </div>
  );
};

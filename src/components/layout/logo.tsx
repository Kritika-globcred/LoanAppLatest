'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function Logo() {
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const logoPath = '/images/globcred-logo.png';

  useEffect(() => {
    setMounted(true);
    // Log the image path for debugging
    console.log('Logo path:', logoPath);
  }, [logoPath]);

  if (!mounted) {
    return (
      <div className="h-10 w-40 flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 rounded h-6 w-32"></div>
      </div>
    );
  }

  if (imageError) {
    return (
      <Link href="/" className="hover:opacity-80 transition-opacity">
        <div className="text-2xl font-bold">
          <span className="text-blue-600">GLOB</span>
          <span className="text-green-600">CRED</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/" className="hover:opacity-80 transition-opacity flex items-center">
      <div className="relative h-10 w-40 flex items-center justify-center">
        <img 
          src={logoPath}
          alt="Globcred Logo" 
          className="h-full w-auto max-w-full object-contain"
          onError={(e) => {
            console.error('Failed to load logo:', e);
            setImageError(true);
          }}
        />
      </div>
    </Link>
  );
}

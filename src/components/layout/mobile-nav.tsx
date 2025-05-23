
"use client";

import type React from 'react';
import { NavItem } from './nav-item';
import { Logo } from './logo';
import { Separator } from '@/components/ui/separator';

interface MobileNavProps {
  onLinkClick?: () => void;
}

const navLinks = [
  { href: '/', label: 'Home' },
];

export function MobileNav({ onLinkClick }: MobileNavProps) {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <Logo />
      </div>
      <nav className="flex flex-col space-y-4">
        {navLinks.map((link) => (
          <NavItem key={link.href} href={link.href} onClick={onLinkClick}>
            {link.label}
          </NavItem>
        ))}
      </nav>
      <Separator className="my-6" />
      <div className="mt-4">
        <NavItem href="/login" onClick={onLinkClick} className="block w-full text-center">
          Login
        </NavItem>
      </div>
    </div>
  );
}

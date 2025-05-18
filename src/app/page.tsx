
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function Home() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];

  return (
    <div className="flex flex-col items-center">
      {/* Responsive Section acting as the main website container */}
      <section
        className="relative w-full bg-cover bg-center rounded-2xl mx-[5%] mt-[2.5%] md:mx-[20%] pt-[5px] px-6 pb-6 md:px-8 md:pb-8 overflow-hidden shadow-lg"
        style={{
          backgroundImage: "url('https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/Untitled%20design.png')"
        }}
      >
        {/* Overlay for background image opacity */}
        <div className="absolute inset-0 bg-[hsl(var(--background)/0.30)] rounded-2xl z-0"></div>

        {/* Content Wrapper - needs to be on top of the overlay */}
        <div className="relative z-10">
          {/* New Header Section (within the responsive section) */}
          <div className="flex justify-between items-center py-4 mb-6">
            <Logo />
            <nav>
              <ul className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
                {navMenuItems.map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => setActiveNavItem(item)}
                      className="text-white hover:opacity-75 transition-opacity focus:outline-none flex items-center text-xs sm:text-sm"
                      aria-current={activeNavItem === item ? "page" : undefined}
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-1.5 sm:mr-2 transition-all duration-300 ease-in-out ${
                          activeNavItem === item
                            ? 'bg-gradient-to-r from-red-500 to-yellow-400 shadow-[0_0_3px_theme(colors.red.500),0_0_5px_theme(colors.yellow.400)] scale-110'
                            : 'bg-gray-400/60'
                        }`}
                        aria-hidden="true"
                      ></span>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button variant="default" size="sm">Login</Button>
              <Button variant="default" size="sm" className="gradient-border-button">Get Started</Button>
            </div>
          </div>

          {/* Existing content of the responsive section */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center md:text-left">
            Our New Responsive Section
          </h2>
          <p className="text-white text-center md:text-left">
            This section demonstrates responsive margins. On mobile devices, it has a 5% margin on the left and right edges, and a 2.5% margin from the top.
            On tablet and desktop screens, it has a 20% margin from the left and right edges, and now a 2.5% margin from the top, providing a focused content area.
          </p>
          <div className="mt-6 flex justify-center md:justify-start">
            <Button variant="default" className="gradient-border-button">Discover More</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

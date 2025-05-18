
'use client';

import { useState } from 'react';
import Image from 'next/image';
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
          {/* Header Section (within the responsive section) */}
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

          {/* New Welcome Section */}
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Welcome to GlobCred
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              We are on a mission to remove the financial constraints between you and your study or work abroad journey.
            </p>

            {/* Aveka Introduction Section - Outer container for layout */}
            <div className="mt-10 flex flex-col md:flex-row items-center justify-center md:items-start md:space-x-6 max-w-3xl mx-auto">
              <div className="flex-shrink-0 mb-4 md:mb-0">
                <Image
                  src="https://placehold.co/100x100.png" // Placeholder for Aveka's image
                  alt="Aveka, GlobCred's Smart AI"
                  width={100}
                  height={100}
                  className="rounded-full border-2 border-white shadow-lg"
                  data-ai-hint="robot avatar"
                />
              </div>
              {/* Aveka's Message Box - Styled like a dialogue box */}
              <div className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm p-4 rounded-xl shadow-md text-left md:flex-grow">
                <p className="font-semibold text-xl mb-1">Aveka</p>
                <p className="text-sm text-gray-200 mb-2 italic">GlobCred's Smart AI Assistant</p>
                <p className="text-base">
                  Hello there! I'm Aveka, your financial and admission counsellor for your Study Abroad Journey.
                  <br /> {/* Added a line break for better readability */}
                  Ready to start your loan journey? Let's begin!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

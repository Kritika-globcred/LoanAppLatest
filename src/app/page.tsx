
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Landmark, Smile, Signal } from 'lucide-react';

export default function Home() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study'];

  const initialLoanDisbursed = 25000000; // $25M
  const initialHappyStudents = 50000; // 50K
  const initialLenderAccess = 61; // 61+ lenders

  // Static statistics values
  const loanDisbursed = initialLoanDisbursed;
  const applicationsProcessed = initialHappyStudents;
  const lenderAccess = initialLenderAccess;
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAvekaMessageVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const lenders = [
    { name: "Avanse", logo: "/images/LenderLogo/Avanse.png", hint: "Avanse logo" },
    { name: "HDFC Credila", logo: "/images/LenderLogo/HDFC.png", hint: "HDFC logo" },
    { name: "MPOWER Financing", logo: "/images/LenderLogo/Mpower.png", hint: "MPOWER logo" },
    { name: "State Bank of India", logo: "/images/LenderLogo/SBI.png", hint: "SBI logo" },
    { name: "Propelled", logo: "/images/LenderLogo/Propelled.png", hint: "Propelled logo" }
  ];
  // Create enough duplicates for smooth marquee effect
  const marqueeLenders = [...lenders, ...lenders, ...lenders];

  const testimonials = [
    {
      name: "Pratik",
      image: "/images/testimonials/pratik.jpg",
      hint: "Pratik's photo",
      text: "GlobCred made my dream of studying abroad a reality! The process was smooth and the support was fantastic.",
      program: "MSc Computer Science"
    },
    {
      name: "Sukriti",
      image: "/images/testimonials/sukriti.jpg",
      hint: "Sukriti's photo",
      text: "I was overwhelmed with the loan options, but Aveka and the GlobCred team guided me perfectly. Highly recommend!",
      program: "MBA in Marketing"
    },
    {
      name: "Ashutosh",
      image: "/images/testimonials/ashutosh.jpg",
      hint: "Ashutosh's photo",
      text: "Securing a work visa and initial funding was challenging until I found GlobCred. They are lifesavers!",
      program: "Software Engineer"
    }
  ];


  // Handle application type selection
  const handleApplicationType = (type: string) => {
    setActiveNavItem(type);
  };

  // Get started button click handler
  const handleGetStarted = () => {
    if (activeNavItem === 'Loan') {
      window.location.href = '/loan-application/mobile';
    } else if (activeNavItem === 'Study') {
      // For study, we'll use the same flow as loan but skip admission KYC
      window.location.href = '/loan-application/mobile?type=study';
    } else if (activeNavItem === 'Work') {
      // For work, we'll use the same flow as loan but skip admission KYC
      window.location.href = '/loan-application/mobile?type=work';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <section
        className="relative w-full bg-cover bg-center rounded-2xl mx-[5%] mt-[2.5%] md:mx-[20%] pt-[5px] px-6 pb-6 md:px-8 md:pb-8 overflow-hidden shadow-[5px_5px_10px_hsl(0,0%,0%/0.2)] shadow-[inset_0_0_2px_hsl(var(--primary)/0.8)]"
      >
        {/* Optimized background image with next/image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero-bg.png"
            alt=""
            fill
            priority
            className="object-cover rounded-2xl"
            quality={80}
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
        <div
          className="absolute inset-0 bg-[hsl(var(--primary))/0.10] rounded-2xl z-0 backdrop-blur-lg"
        />

        <div className="relative z-10">
          {/* Header Section */}
          <div className="flex justify-between items-center py-4 mb-6">
            <Logo />
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href="/login">
                <Button variant="default" size="sm">Login</Button>
              </Link>
            </div>
          </div>

          {/* Hero Section Content */}
          <div className="text-center text-white py-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 max-w-2xl mx-auto">
              Welcome to GlobCred
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              We are on a mission to remove the financial constraints between you and your study or work abroad journey.
            </p>

            <div className="mt-10 flex flex-col md:flex-row items-center justify-center md:items-start md:space-x-6 max-w-3xl mx-auto">
              <div className="flex-shrink-0 mb-4 md:mb-0">
                <div className="relative w-[50px] h-[50px] rounded-full border-2 border-white shadow-lg overflow-hidden">
                  <Image
                    src="/images/aveka.png" 
                    alt="Aveka, GlobCred's Smart AI"
                    fill
                    sizes="50px"
                    className="object-cover"
                    data-ai-hint="robot avatar"
                    priority
                  />
                </div>
              </div>
              <div
                className={`bg-[hsl(var(--card)/0.25)] backdrop-blur-sm p-4 rounded-xl shadow-md text-left md:flex-grow
                            transform transition-all duration-500 ease-out
                            ${avekaMessageVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              >
                <p className="font-semibold text-xl mb-1">Aveka</p>
                <p className="text-sm text-gray-200 mb-2 italic">GlobCred's Smart AI Assistant</p>
                <p className="text-base">
                  Hello there! I&apos;m Aveka, your financial and admission counsellor for your Study Abroad Journey.
                  <br />
                  Ready to start your loan journey? Let&apos;s begin!
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center space-y-6">
              <p className="text-white text-lg font-medium">I am applying for</p>
              <nav className="w-full max-w-md">
                <ul className="flex items-center justify-center space-x-4 sm:space-x-6 md:space-x-8">
                  {navMenuItems.map((item) => (
                    <li key={item}>
                      <button
                        onClick={() => handleApplicationType(item)}
                        className="text-white hover:opacity-75 transition-opacity focus:outline-none flex items-center text-sm sm:text-base"
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-1.5 sm:mr-2 shrink-0 ${
                            activeNavItem === item
                              ? 'progress-dot-active'
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
              <Button 
                variant="default" 
                size="lg" 
                className="gradient-border-button mt-2"
                onClick={handleGetStarted}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Get Started
              </Button>
            </div>
          </div>
          {/* End Hero Section Content */}

          {/* Testimonials Section */}
          <section className="py-12 text-white">
            <h2 className="text-3xl font-bold text-center mb-10">What Our Students Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl text-white border-0 rounded-xl">
                  <CardHeader className="flex flex-row items-center space-x-4 pb-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={60}
                      height={60}
                      className="rounded-full"
                      data-ai-hint={testimonial.hint}
                    />
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <p className="text-sm text-gray-300">{testimonial.program}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-200">&quot;{testimonial.text}&quot;</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          {/* End Testimonials Section */}

          {/* Top Lenders Section - Optimized */}
          <section className="py-12 text-white">
            <h2 className="text-3xl font-bold text-center mb-10">Our Top Lending Partners</h2>
            <div className="relative w-full overflow-hidden">
              <div className="flex animate-marquee whitespace-nowrap">
                {marqueeLenders.map((lender, index) => {
                  const isFirstOccurrence = index === lenders.findIndex(l => l.name === lender.name);
                  return (
                    <div 
                      key={`${lender.name}-${index}`} 
                      className="mx-4 flex-shrink-0 flex items-center justify-center h-20 w-[150px]"
                    >
                      <Image 
                        src={lender.logo} 
                        alt={lender.name}
                        width={150}
                        height={60}
                        className="h-full w-auto object-contain"
                        data-ai-hint={lender.hint}
                        priority={isFirstOccurrence && index < 3} // Only preload first occurrence of first 3 logos
                        loading={isFirstOccurrence ? 'eager' : 'lazy'}
                        quality={75} // Reduce quality for better performance
                        sizes="(max-width: 768px) 100vw, 150px"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          {/* End Top Lenders Section */}

          {/* Live Numbers Section */}
          <section className="py-12 text-white">
            <h2 className="text-3xl font-bold text-center mb-10">Our Impact</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl text-white text-center border-0 rounded-xl">
                <CardHeader>
                  <div className="flex justify-center mb-3">
                    <Landmark size={40} className="text-primary" />
                  </div>
                  <CardTitle className="text-4xl font-bold">
                    ${(loanDisbursed / 1000000).toFixed(0)}M+
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-300">Loan Sanctioned</p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl text-white text-center border-0 rounded-xl">
                <CardHeader>
                   <div className="flex justify-center mb-3">
                    <Smile size={40} className="text-primary" />
                  </div>
                  <CardTitle className="text-4xl font-bold">
                    {applicationsProcessed.toLocaleString()}+
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-300">Applications Processed</p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl text-white text-center border-0 rounded-xl">
                <CardHeader>
                  <div className="flex justify-center mb-3">
                    <Signal size={40} className="text-primary" />
                  </div>
                  <CardTitle className="text-4xl font-bold">
                    {lenderAccess}+
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-300">Lender Access</p>
                </CardContent>
              </Card>
            </div>
          </section>
          {/* End Live Numbers Section */}

        </div>
      </section>
    </div>
  );
}

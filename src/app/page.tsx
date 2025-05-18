
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Landmark, Smile, Signal } from 'lucide-react';

export default function Home() {
  const [activeNavItem, setActiveNavItem] = useState('Loan');
  const navMenuItems = ['Loan', 'Study', 'Work'];

  const initialLoanDisbursed = 127902;
  const initialHappyStudents = 57905;
  const initialLiveVisitors = 1234;

  const [loanDisbursed, setLoanDisbursed] = useState(initialLoanDisbursed);
  const [happyStudents, setHappyStudents] = useState(initialHappyStudents);
  const [liveVisitors, setLiveVisitors] = useState(initialLiveVisitors);
  const [avekaMessageVisible, setAvekaMessageVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAvekaMessageVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loanInterval = setInterval(() => {
      setLoanDisbursed(prev => prev + 1);
    }, 2 * 60 * 1000); // Every 2 minutes

    const studentInterval = setInterval(() => {
      setHappyStudents(prev => prev + 1);
    }, 2 * 60 * 1000); // Every 2 minutes

    const visitorInterval = setInterval(() => {
      setLiveVisitors(prev => {
        const change = prev * 0.10 * (Math.random() > 0.5 ? 1 : -1);
        let newValue = Math.round(prev + change);
        newValue = Math.max(978, Math.min(1789, newValue));
        return newValue;
      });
    }, 1000); // Every second

    return () => {
      clearInterval(loanInterval);
      clearInterval(studentInterval);
      clearInterval(visitorInterval);
    };
  }, []);

  const lenders = [
    { name: "Lender A", logo: "https://placehold.co/150x60.png?text=Lender+A", hint: "bank logo" },
    { name: "Lender B", logo: "https://placehold.co/150x60.png?text=Lender+B", hint: "finance company" },
    { name: "Lender C", logo: "https://placehold.co/150x60.png?text=Lender+C", hint: "credit union" },
    { name: "Lender D", logo: "https://placehold.co/150x60.png?text=Lender+D", hint: "investment firm" },
    { name: "Lender E", logo: "https://placehold.co/150x60.png?text=Lender+E", hint: "financial services" },
    { name: "Lender F", logo: "https://placehold.co/150x60.png?text=Lender+F", hint: "loan provider" },
  ];
  const duplicatedLenders = [...lenders, ...lenders]; // For seamless marquee

  const testimonials = [
    {
      name: "Alex Johnson",
      image: "https://placehold.co/80x80.png",
      hint: "student face",
      text: "GlobCred made my dream of studying abroad a reality! The process was smooth and the support was fantastic.",
      program: "MSc Computer Science"
    },
    {
      name: "Priya Sharma",
      image: "https://placehold.co/80x80.png",
      hint: "graduate photo",
      text: "I was overwhelmed with the loan options, but Aveka and the GlobCred team guided me perfectly. Highly recommend!",
      program: "MBA in Marketing"
    },
    {
      name: "Carlos Rossi",
      image: "https://placehold.co/80x80.png",
      hint: "happy person",
      text: "Securing a work visa and initial funding was challenging until I found GlobCred. They are lifesavers!",
      program: "Software Engineer"
    }
  ];


  return (
    <div className="flex flex-col items-center">
      <section
        className="relative w-full bg-cover bg-center rounded-2xl mx-[5%] mt-[2.5%] md:mx-[20%] pt-[5px] px-6 pb-6 md:px-8 md:pb-8 overflow-hidden shadow-[5px_5px_10px_hsl(0,0%,0%/0.2)] shadow-[inset_0_0_2px_hsl(var(--primary)/0.8)]"
        style={{
          backgroundImage:
            "url('https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/Untitled%20design.png')",
        }}
      >
        <div className="absolute inset-0 bg-[hsl(var(--primary)/0.10)] backdrop-blur-lg rounded-2xl z-0"></div>

        <div className="relative z-10">
          {/* Header Section */}
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
                <Image
                  src="https://placehold.co/50x50.png" // Placeholder, replace with actual Aveka image URL
                  alt="Aveka, GlobCred's Smart AI"
                  width={50}
                  height={50}
                  className="rounded-full border-2 border-white shadow-lg"
                  data-ai-hint="robot avatar"
                />
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

            <div className="mt-8 flex justify-center">
              <Button variant="default" size="lg" className="gradient-border-button">
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
                <Card key={index} className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl text-white border-0">
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

          {/* Top Lenders Section */}
          <section className="py-12 text-white">
            <h2 className="text-3xl font-bold text-center mb-10">Our Top Lending Partners</h2>
            <div className="relative w-full overflow-hidden">
              <div className="flex animate-marquee whitespace-nowrap">
                {duplicatedLenders.map((lender, index) => (
                  <div key={index} className="mx-4 flex-shrink-0">
                    <Image 
                      src={lender.logo} 
                      alt={lender.name} 
                      width={150} 
                      height={60} 
                      className="h-auto"
                      data-ai-hint={lender.hint}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/* End Top Lenders Section */}

          {/* Live Numbers Section */}
          <section className="py-12 text-white">
            <h2 className="text-3xl font-bold text-center mb-10">Our Impact</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl text-white text-center border-0">
                <CardHeader>
                  <div className="flex justify-center mb-3">
                    <Landmark size={40} className="text-primary" />
                  </div>
                  <CardTitle className="text-4xl font-bold">
                    {loanDisbursed.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-300">Loan Amount Disbursed</p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl text-white text-center border-0">
                <CardHeader>
                   <div className="flex justify-center mb-3">
                    <Smile size={40} className="text-primary" />
                  </div>
                  <CardTitle className="text-4xl font-bold">
                    {happyStudents.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-300">Happy Students</p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(var(--card)/0.25)] backdrop-blur-sm shadow-xl text-white text-center border-0">
                <CardHeader>
                  <div className="flex justify-center mb-3">
                    <Signal size={40} className="text-primary" />
                  </div>
                  <CardTitle className="text-4xl font-bold">
                    {liveVisitors.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-300">Live Website Visitors</p>
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


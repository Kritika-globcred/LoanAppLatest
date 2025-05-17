
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap, BarChart } from "lucide-react";
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col items-center"> {/* Removed space-y-16 for more precise margin control */}
      {/* Hero Section */}
      <section className="text-center w-full py-12 md:py-24">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          Build with <span className="text-primary">Adaptable Canvas</span>
        </h1>
        <p className="mt-4 md:mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience seamless design and intuitive navigation that adapts to any screen. Create stunning, responsive applications with ease.
        </p>
        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button size="lg" className="gradient-border-button w-full sm:w-auto">
            Get Started Today
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Learn More
          </Button>
        </div>
      </section>

      {/* New Responsive Section */}
      <section className="w-full bg-card p-6 md:p-8 rounded-lg shadow-lg mx-[5%] mt-[10%] md:mx-[20%] md:mt-[20%]">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 text-center md:text-left">
          Our New Responsive Section
        </h2>
        <p className="text-muted-foreground text-center md:text-left">
          This section demonstrates responsive margins. On mobile devices, it has a 5% margin on the left and right edges, and a 10% margin from the top.
          On tablet and desktop screens, these margins increase to 20% from the top, left, and right edges, providing a focused content area.
        </p>
        <div className="mt-6 flex justify-center md:justify-start">
          <Button>Discover More</Button>
        </div>
      </section>
    </div>
  );
}

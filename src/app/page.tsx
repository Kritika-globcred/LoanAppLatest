
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap, BarChart } from "lucide-react";
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col items-center space-y-16">
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
    </div>
  );
}

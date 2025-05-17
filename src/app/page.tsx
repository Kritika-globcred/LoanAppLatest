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

      {/* Features Section */}
      <section className="w-full">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Why Choose Adaptable Canvas?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Optimized for performance, ensuring your application loads quickly and runs smoothly on all devices.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mb-4">
                <CheckCircle className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Fully Responsive</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Designs that adapt perfectly to desktops, tablets, and mobile phones, providing a consistent user experience.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mb-4">
                <BarChart className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">Intuitive Design</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Clean layouts and easy-to-use navigation, making your application a joy to interact with.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Placeholder Content Section */}
      <section className="w-full py-12 md:py-16 bg-secondary/50 rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Discover More</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Explore our comprehensive documentation and vibrant community to get the most out of Adaptable Canvas.
          </p>
          <Image 
            src="https://placehold.co/800x400.png" 
            alt="Placeholder image illustrating a feature" 
            width={800} 
            height={400}
            data-ai-hint="technology abstract"
            className="rounded-md shadow-lg mx-auto" 
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full text-center py-12 md:py-20">
        <h2 className="text-3xl font-bold text-foreground">Ready to Get Started?</h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
          Join thousands of developers building beautiful, responsive apps with Adaptable Canvas.
        </p>
        <div className="mt-8">
          <Button size="lg" className="gradient-border-button">
            Sign Up Now
          </Button>
        </div>
      </section>
    </div>
  );
}

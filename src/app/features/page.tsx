import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BarChartBig, PackageOpen } from "lucide-react";
import Image from "next/image";

export default function FeaturesPage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
          Explore Our Features
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover the powerful tools and capabilities Adaptable Canvas offers to bring your ideas to life with elegance and efficiency.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <Image 
            src="https://placehold.co/600x400.png" 
            alt="Responsive Design Showcase"
            width={600} 
            height={400}
            data-ai-hint="web design"
            className="rounded-lg shadow-xl"
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-foreground">Truly Adaptive Layouts</h2>
          <p className="text-muted-foreground">
            Our core strength lies in creating UIs that are not just responsive, but truly adaptive. 
            Content reflows intelligently, components adjust gracefully, and user experience remains paramount across all devices.
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2"><ShieldCheck className="text-primary w-5 h-5" /> Pixel-perfect on every screen.</li>
            <li className="flex items-center gap-2"><BarChartBig className="text-primary w-5 h-5" /> Enhanced readability and usability.</li>
            <li className="flex items-center gap-2"><PackageOpen className="text-primary w-5 h-5" /> Faster development cycles.</li>
          </ul>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 md:order-2">
          <h2 className="text-3xl font-semibold text-foreground">Intuitive Navigation System</h2>
          <p className="text-muted-foreground">
            Navigate complex applications with ease. Our navigation patterns are designed based on extensive UX research, 
            ensuring users find what they need quickly and efficiently.
          </p>
           <Button className="gradient-border-button">
            See Navigation in Action
          </Button>
        </div>
        <div className="md:order-1">
           <Image 
            src="https://placehold.co/600x400.png" 
            alt="Intuitive Navigation Example"
            width={600} 
            height={400}
            data-ai-hint="user interface"
            className="rounded-lg shadow-xl"
          />
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-10 text-foreground">More Key Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Customizable Themes", description: "Easily adapt the look and feel to match your brand with our flexible theming options.", icon: <ShieldCheck /> },
            { title: "Performance Optimized", description: "Built for speed, ensuring a smooth and fast experience for your users.", icon: <BarChartBig /> },
            { title: "Developer Friendly", description: "Clean code, well-documented components, and easy integration.", icon: <PackageOpen /> },
          ].map(feature => (
            <Card key={feature.title} className="shadow-lg">
              <CardHeader>
                <div className="text-primary mb-2">{React.cloneElement(feature.icon, {className: "w-8 h-8"})}</div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

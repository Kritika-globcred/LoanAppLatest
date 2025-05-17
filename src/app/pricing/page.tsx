import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const pricingTiers = [
  {
    name: "Basic",
    price: "$9",
    frequency: "/month",
    description: "For individuals and small projects.",
    features: ["Responsive Layout", "Basic Navigation", "Community Support"],
    cta: "Choose Basic",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    frequency: "/month",
    description: "For growing businesses and professionals.",
    features: ["All Basic Features", "Advanced Navigation", "Priority Support", "Custom Themes"],
    cta: "Choose Pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    frequency: "",
    description: "For large organizations with specific needs.",
    features: ["All Pro Features", "Dedicated Support", "On-Premise Option", "SLA"],
    cta: "Contact Us",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that's right for you. No hidden fees, cancel anytime.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-8 items-stretch">
        {pricingTiers.map((tier) => (
          <Card key={tier.name} className={`flex flex-col shadow-lg ${tier.highlight ? 'border-primary border-2 ring-4 ring-primary/20' : ''}`}>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-foreground">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary">{tier.price}</span>
                {tier.frequency && <span className="text-muted-foreground">{tier.frequency}</span>}
              </div>
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-5 h-5 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button size="lg" className={`w-full ${tier.highlight ? 'gradient-border-button' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
                {tier.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      <section className="text-center py-12 bg-secondary/50 rounded-lg">
        <h2 className="text-2xl font-semibold text-foreground mb-3">Not sure which plan is right?</h2>
        <p className="text-muted-foreground mb-6">Our team can help you choose the best plan for your needs.</p>
        <Button variant="outline" size="lg">
          Get Expert Advice
        </Button>
      </section>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
          Get In Touch
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We'd love to hear from you! Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-12 items-start">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Send us a message</CardTitle>
            <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="john.doe@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Regarding..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your message here..." rows={5} />
            </div>
            <Button type="submit" size="lg" className="w-full gradient-border-button">
              Send Message
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-8 pt-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> Email Us
            </h3>
            <p className="text-muted-foreground">For general inquiries or support:</p>
            <a href="mailto:info@adaptablecanvas.com" className="text-primary hover:underline">info@adaptablecanvas.com</a>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" /> Call Us
            </h3>
            <p className="text-muted-foreground">Talk to our sales or support team:</p>
            <a href="tel:+1234567890" className="text-primary hover:underline">+1 (234) 567-890</a>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Our Office
            </h3>
            <p className="text-muted-foreground">123 Canvas Lane, Suite 404<br />Tech City, CA 90210</p>
          </div>
        </div>
      </section>
    </div>
  );
}

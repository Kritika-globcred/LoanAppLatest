
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo"; // Added Logo import

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Responsive Section acting as the main website container */}
      <section className="w-full bg-[hsl(var(--background)/0.30)] backdrop-blur-[25px] p-6 md:p-8 rounded-[7px] mx-[5%] mt-[2.5%] md:mx-[20%] border border-[hsl(var(--background))] shadow-[inset_0_0_20px_hsl(var(--background)/0.5)]">
        {/* New Header Section (within the responsive section) */}
        <div className="flex justify-between items-center py-4 mb-6"> {/* Added mb-6 for spacing below header */}
          <Logo />
          <div className="flex items-center space-x-4">
            <Button variant="outline">Login</Button>
            <Button>Get Started</Button>
          </div>
        </div>

        {/* Existing content of the responsive section - can be replaced or removed later */}
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 text-center md:text-left">
          Our New Responsive Section
        </h2>
        <p className="text-muted-foreground text-center md:text-left">
          This section demonstrates responsive margins. On mobile devices, it has a 5% margin on the left and right edges, and a 2.5% margin from the top.
          On tablet and desktop screens, it has a 20% margin from the left and right edges, and now a 2.5% margin from the top, providing a focused content area.
        </p>
        <div className="mt-6 flex justify-center md:justify-start">
          <Button>Discover More</Button>
        </div>
      </section>
    </div>
  );
}

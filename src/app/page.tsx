
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Responsive Section acting as the main website container */}
      <section
        className="w-full bg-cover bg-center rounded-2xl mx-[5%] mt-[2.5%] md:mx-[20%] p-6 md:p-8"
        style={{
          backgroundImage: "url('https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/Loan_App_BG.png')"
        }}
      >
        {/* Content is wrapped in a div that was previously used for z-indexing if an overlay was present */}
        <div>
          {/* New Header Section (within the responsive section) */}
          <div className="flex justify-between items-center py-4 mb-6">
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
        </div>
      </section>
    </div>
  );
}

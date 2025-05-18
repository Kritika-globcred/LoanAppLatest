
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Responsive Section acting as the main website container */}
      <section
        className="relative w-full bg-cover bg-center rounded-2xl mx-[5%] mt-[2.5%] md:mx-[20%] p-6 md:p-8 overflow-hidden shadow-lg"
        style={{
          backgroundImage: "url('https://raw.githubusercontent.com/Kritika-globcred/Loan-Application-Portal/main/Loan_App_BG.png')"
        }}
      >
        {/* Overlay for background image opacity */}
        <div className="absolute inset-0 bg-[hsl(var(--background)/0.30)] rounded-2xl z-0"></div>

        {/* Content Wrapper - needs to be on top of the overlay */}
        <div className="relative z-10">
          {/* New Header Section (within the responsive section) */}
          <div className="flex justify-between items-center py-4 mb-6">
            <Logo />
            <div className="flex items-center space-x-4">
              <Button variant="default">Login</Button>
              <Button variant="default">Get Started</Button>
            </div>
          </div>

          {/* Existing content of the responsive section - can be replaced or removed later */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center md:text-left">
            Our New Responsive Section
          </h2>
          <p className="text-white text-center md:text-left">
            This section demonstrates responsive margins. On mobile devices, it has a 5% margin on the left and right edges, and a 2.5% margin from the top.
            On tablet and desktop screens, it has a 20% margin from the left and right edges, and now a 2.5% margin from the top, providing a focused content area.
          </p>
          <div className="mt-6 flex justify-center md:justify-start">
            <Button variant="default">Discover More</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

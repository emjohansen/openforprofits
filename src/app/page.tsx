import { BusinessInputForm } from '@/components/business-input-form';
import { Toaster } from "@/components/ui/toaster"
import Image from 'next/image'; // Import the Image component

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-12 bg-background">
        {/* Added the logo image */}
       <Image
         src="/O4F_COLOR@4x.png" // Updated path to be relative to public directory
         alt="Open For Profit Logo"
         width={300} // Adjust width as needed
         height={129.69} // Adjust height as needed
         className="mb-8 mt-4 mr-9" // Added margin top and bottom for spacing
       />
       <p className="text-center text-muted-foreground mb-8"> {/* Adjusted margin */}
       Will your business idea make money? <br></br>Use our profitability calculator to analyze costs, set the right price, <br></br>and forecast revenue — all in one simple <b>FREE</b> tool.
       </p>
       <BusinessInputForm />
       <Toaster />
    </main>
  );
}

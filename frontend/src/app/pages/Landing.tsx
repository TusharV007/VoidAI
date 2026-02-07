import { Hero } from "../components/hero";
import { Features } from "../components/features";
import { HowItWorks } from "../components/how-it-works";
import { CTA } from "../components/cta";
import { Footer } from "../components/footer";

export function Landing() {
    return (
        <div className="min-h-screen bg-white text-black">
            <Hero />
            <Features />
            <HowItWorks />
            <CTA />
            <Footer />
        </div>
    );
}

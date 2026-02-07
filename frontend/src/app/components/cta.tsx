import { motion } from "motion/react";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-32 px-6 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto text-center border-4 border-black p-16"
      >
        <h2 className="text-5xl md:text-7xl mb-6">
          Coming Soon
        </h2>
        <p className="text-xl md:text-2xl text-neutral-600 mb-10 max-w-2xl mx-auto">
          We're building the future of no-code machine learning. Join the waitlist to be notified when we launch.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href="/register">
            <Button
              size="lg"
              className="bg-black text-white hover:bg-neutral-800 px-8 py-6 text-lg group"
            >
              Join Waitlist
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
          <a href="/register">
            <Button
              variant="outline"
              size="lg"
              className="border-black text-black hover:bg-black hover:text-white px-8 py-6 text-lg"
            >
              Get Updates
            </Button>
          </a>
        </div>
        <p className="mt-8 text-sm text-neutral-500">
          Be among the first to experience the platform • Early access available
        </p>
      </motion.div>
    </section>
  );
}

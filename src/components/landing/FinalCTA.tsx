import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="py-24 md:py-32">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Ready to turn direction into deliverables?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Start your first brief and see what AETEA can do for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12">
                Start a Brief
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="mailto:hello@aetea.ai?subject=Demo%20Request">
              <Button size="lg" variant="outline" className="border-border hover:bg-secondary px-8 h-12">
                <Calendar className="mr-2 h-4 w-4" />
                Book a Demo
              </Button>
            </a>
            <a href="mailto:hello@aetea.ai?subject=Waitlist">
              <Button size="lg" variant="ghost" className="px-8 h-12">
                <Mail className="mr-2 h-4 w-4" />
                Join the Waitlist
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

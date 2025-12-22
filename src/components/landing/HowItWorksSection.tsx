import { UserCircle, FileText, Wand2, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserCircle,
    title: "Select Your Role",
    description: "Choose whether you're a Developer, Designer, or Product Manager. We'll tailor everything to your profession."
  },
  {
    icon: FileText,
    title: "Add Your Details",
    description: "Fill a quick form or describe your portfolio in one prompt. Either way, we've got you covered."
  },
  {
    icon: Wand2,
    title: "AI Does the Magic",
    description: "Our AI generates professional content, selects the perfect layout, and creates your complete portfolio."
  },
  {
    icon: Rocket,
    title: "Publish & Share",
    description: "Review, customize if needed, and publish. Your portfolio is live instantly with a unique URL."
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            From zero to portfolio in <span className="gradient-text">4 steps</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The fastest way to create a professional portfolio. No design experience needed.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/50 to-primary/20 hidden md:block" />

            <div className="space-y-12">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-6 items-start">
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-card border-2 border-primary/50 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-7 h-7 text-primary" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <div className="pt-3">
                    <h3 className="font-display text-2xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-lg text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Portfolify?",
    answer:
      "Portfolify is an AI-powered portfolio builder that helps professionals create stunning, personalized portfolio websites in minutes — no coding required.",
  },
  {
    question: "Is Portfolify free to use?",
    answer:
      "Yes! Portfolify offers a generous free tier that lets you create and publish one portfolio. Premium plans unlock additional templates, analytics, custom domains, and more.",
  },
  {
    question: "Can I import my resume or LinkedIn profile?",
    answer:
      "Absolutely. You can upload a PDF resume or paste your LinkedIn URL and Portfolify will automatically extract your experience, skills, and projects to populate your portfolio.",
  },
  {
    question: "How do I publish my portfolio?",
    answer:
      "Once you're happy with your portfolio, simply click \"Publish\" in the editor. Your portfolio will be live instantly with a shareable link you can send to recruiters and clients.",
  },
  {
    question: "Can I use a custom domain?",
    answer:
      "Custom domains are available on our Pro and Team plans. You can connect any domain you own and we'll handle the SSL certificate automatically.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Security is a top priority. All data is encrypted at rest and in transit. We use industry-standard authentication and never share your information with third parties.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Portfolify.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border/50 rounded-lg px-5 bg-card/50 backdrop-blur-sm"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

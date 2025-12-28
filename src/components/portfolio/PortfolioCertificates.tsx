import { motion, AnimatePresence } from "framer-motion";
import { Award, ExternalLink, X, FileText, Download } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./AnimatedSection";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  pdf_url?: string;
  thumbnail_url?: string;
  credential_url?: string;
}

interface PortfolioCertificatesProps {
  title?: string;
  certificates: Certificate[];
}

function CertificateModal({ 
  certificate, 
  isOpen, 
  onClose 
}: { 
  certificate: Certificate | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!certificate) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 z-50 flex items-center justify-center"
          >
            <div className="relative w-full max-w-4xl max-h-full overflow-hidden rounded-3xl bg-card border border-border shadow-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Award className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{certificate.name}</h3>
                    <p className="text-muted-foreground">
                      {certificate.issuer} • {certificate.date}
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF Preview */}
              <div className="aspect-[4/3] bg-secondary/20">
                {certificate.pdf_url ? (
                  <iframe
                    src={`${certificate.pdf_url}#toolbar=0`}
                    className="w-full h-full"
                    title={certificate.name}
                  />
                ) : certificate.thumbnail_url ? (
                  <img
                    src={certificate.thumbnail_url}
                    alt={certificate.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="w-16 h-16 mb-4 opacity-50" />
                    <p>No preview available</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 flex gap-3 justify-end border-t border-border/50">
                {certificate.pdf_url && (
                  <Button variant="outline" asChild className="gap-2">
                    <a href={certificate.pdf_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4" /> Download PDF
                    </a>
                  </Button>
                )}
                {certificate.credential_url && (
                  <Button asChild className="gap-2">
                    <a href={certificate.credential_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" /> Verify Credential
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function PortfolioCertificates({ title = "Certifications", certificates }: PortfolioCertificatesProps) {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  if (!certificates || certificates.length === 0) return null;

  return (
    <section id="certificates" className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/20 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <span>🏆</span>
            <span>Achievements</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional certifications and credentials I've earned
          </p>
        </AnimatedSection>

        {/* Certificates Grid */}
        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert, index) => (
            <StaggerItem key={cert.id || index}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedCertificate(cert)}
                className="group cursor-pointer h-full"
              >
                <div className="h-full p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-primary/30 transition-all duration-300 backdrop-blur-sm overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-purple-500/10 mb-5">
                    {cert.thumbnail_url ? (
                      <img
                        src={cert.thumbnail_url}
                        alt={cert.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Award className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="p-3 rounded-full bg-background/90">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                    </div>

                    {/* PDF indicator */}
                    {cert.pdf_url && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" /> PDF
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {cert.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    <p className="text-xs text-muted-foreground/70">{cert.date}</p>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        certificate={selectedCertificate}
        isOpen={!!selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
      />
    </section>
  );
}

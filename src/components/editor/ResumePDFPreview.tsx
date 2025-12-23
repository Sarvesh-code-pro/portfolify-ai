import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, RefreshCw } from "lucide-react";
import { generateResumePDFDataUrl, downloadResumePDF } from "@/lib/pdf-generator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ResumePDFPreviewProps {
  portfolio: {
    id: string;
    hero_title?: string | null;
    hero_subtitle?: string | null;
    about_text?: string | null;
    skills?: string[];
    projects?: any[];
    experience?: any[];
    education?: any[];
    links?: any;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumePDFPreview({ portfolio, open, onOpenChange }: ResumePDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = async () => {
    setLoading(true);
    try {
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      const url = generateResumePDFDataUrl(portfolio);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !pdfUrl) {
      generatePreview();
    }
  }, [open]);

  const handleDownload = () => {
    const name = portfolio.hero_title?.split(" - ")[0]?.trim()?.toLowerCase().replace(/\s+/g, "_") || "resume";
    downloadResumePDF(portfolio, `${name}_resume.pdf`);
  };

  const handleRegenerate = () => {
    setPdfUrl(null);
    generatePreview();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            ATS-Friendly Resume Preview
          </DialogTitle>
          <DialogDescription>
            Preview your resume before downloading. This PDF uses a single-column layout with simple fonts for ATS compatibility.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-muted-foreground">Generating PDF preview...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="flex-1 min-h-[500px] rounded-lg overflow-hidden border border-border">
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="Resume PDF Preview"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">No preview available</p>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
            <Button onClick={handleDownload} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

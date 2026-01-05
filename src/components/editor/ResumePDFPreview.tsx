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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  template?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumePDFPreview({ portfolio, template = "classic", open, onOpenChange }: ResumePDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLimit, setPageLimit] = useState<1 | 2>(1);

  const templateStyle = template as "classic" | "modern" | "minimal" | "professional" | "executive";

  const generatePreview = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const url = generateResumePDFDataUrl(portfolio, pageLimit, templateStyle);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      generatePreview();
    }
  }, [open, pageLimit, template]);

  const handleDownload = () => {
    const name = portfolio.hero_title?.split(" - ")[0]?.trim()?.toLowerCase().replace(/\s+/g, "_") || "resume";
    downloadResumePDF(portfolio, `${name}_resume.pdf`, pageLimit, templateStyle);
  };

  const handleRegenerate = () => {
    setPdfUrl(null);
    generatePreview();
  };

  const handlePageLimitChange = (value: string) => {
    setPageLimit(value === "2" ? 2 : 1);
    setPdfUrl(null);
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
            Preview your resume before downloading. Single-column layout with simple fonts for ATS compatibility.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Label htmlFor="page-limit" className="text-sm text-muted-foreground whitespace-nowrap">
              Page limit:
            </Label>
            <Select value={pageLimit.toString()} onValueChange={handlePageLimitChange}>
              <SelectTrigger id="page-limit" className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">One page</SelectItem>
                <SelectItem value="2">Two pages</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground">
            {pageLimit === 1 
              ? "Content will be intelligently compressed to fit one page" 
              : "Full content with natural page breaks"}
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-muted/50 rounded-lg min-h-[500px]">
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
            <div className="flex-1 flex items-center justify-center bg-muted/50 rounded-lg min-h-[500px]">
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

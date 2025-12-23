import { jsPDF } from "jspdf";

interface PortfolioData {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  about_text?: string | null;
  skills?: string[];
  projects?: Array<{
    title: string;
    description: string;
    technologies?: string[];
    link?: string;
  }>;
  experience?: Array<{
    company: string;
    role: string;
    period: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  links?: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

// ATS-friendly PDF generation using structured data only (no HTML conversion)
export function generateATSResumePDF(portfolio: PortfolioData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Simple black text on white background (ATS requirement)
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);

  // Helper to add new page if needed
  const checkPageBreak = (neededHeight: number = 40) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Helper to wrap and print text
  const printWrappedText = (text: string, fontSize: number, lineHeight: number = 1.4) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      checkPageBreak();
      doc.text(line, margin, y);
      y += fontSize * lineHeight;
    });
  };

  // Section header (standard ATS format)
  const printSectionHeader = (title: string) => {
    checkPageBreak(30);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), margin, y);
    y += 4;
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
  };

  // ===== HEADER / NAME =====
  const name = portfolio.hero_title?.split(" - ")[0]?.trim() || "Name";
  const title = portfolio.hero_title?.split(" - ")[1]?.trim() || portfolio.hero_subtitle || "";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(name, margin, y);
  y += 20;

  if (title) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(title, margin, y);
    y += 16;
  }

  // Contact info (single line or stacked)
  const contacts: string[] = [];
  if (portfolio.links?.email) contacts.push(portfolio.links.email);
  if (portfolio.links?.phone) contacts.push(portfolio.links.phone);
  if (portfolio.links?.linkedin) contacts.push(portfolio.links.linkedin.replace("https://", ""));
  if (portfolio.links?.github) contacts.push(portfolio.links.github.replace("https://", ""));
  if (portfolio.links?.website) contacts.push(portfolio.links.website.replace("https://", ""));

  if (contacts.length > 0) {
    doc.setFontSize(10);
    const contactText = contacts.join(" | ");
    const contactLines = doc.splitTextToSize(contactText, contentWidth);
    contactLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 12;
    });
  }

  y += 6;

  // ===== SUMMARY =====
  if (portfolio.about_text) {
    printSectionHeader("Summary");
    // Clean the about text - remove any HTML if present
    const cleanAbout = portfolio.about_text.replace(/<[^>]*>/g, "").trim();
    printWrappedText(cleanAbout, 10, 1.5);
  }

  // ===== EXPERIENCE =====
  if (portfolio.experience && portfolio.experience.length > 0) {
    printSectionHeader("Experience");
    
    portfolio.experience.forEach((exp, index) => {
      checkPageBreak(50);
      
      // Company and Role on same line (bold)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(exp.role, margin, y);
      
      // Company name (normal)
      doc.setFont("helvetica", "normal");
      const roleWidth = doc.getTextWidth(exp.role);
      doc.text(` | ${exp.company}`, margin + roleWidth, y);
      y += 14;

      // Period
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(exp.period || "", margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");

      // Description - split into bullet points if possible
      if (exp.description) {
        const descLines = exp.description.split(/[•\-\n]/).filter(line => line.trim());
        descLines.forEach((line) => {
          const cleanLine = line.trim();
          if (cleanLine) {
            checkPageBreak();
            const bulletText = `• ${cleanLine}`;
            const wrappedBullet = doc.splitTextToSize(bulletText, contentWidth - 10);
            wrappedBullet.forEach((wLine: string, idx: number) => {
              doc.text(idx === 0 ? wLine : `  ${wLine}`, margin, y);
              y += 14;
            });
          }
        });
      }

      if (index < portfolio.experience.length - 1) {
        y += 6;
      }
    });
  }

  // ===== SKILLS =====
  if (portfolio.skills && portfolio.skills.length > 0) {
    printSectionHeader("Skills");
    const skillsText = portfolio.skills.join(", ");
    printWrappedText(skillsText, 10, 1.5);
  }

  // ===== PROJECTS =====
  if (portfolio.projects && portfolio.projects.length > 0) {
    printSectionHeader("Projects");
    
    portfolio.projects.forEach((project, index) => {
      checkPageBreak(40);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(project.title, margin, y);
      y += 14;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      if (project.description) {
        printWrappedText(project.description, 10, 1.4);
      }
      
      if (project.technologies && project.technologies.length > 0) {
        const techText = `Technologies: ${project.technologies.join(", ")}`;
        doc.setFont("helvetica", "italic");
        printWrappedText(techText, 9, 1.4);
        doc.setFont("helvetica", "normal");
      }
      
      if (project.link) {
        doc.setFont("helvetica", "italic");
        printWrappedText(project.link, 9, 1.4);
        doc.setFont("helvetica", "normal");
      }

      if (index < portfolio.projects.length - 1) {
        y += 6;
      }
    });
  }

  // ===== EDUCATION =====
  if (portfolio.education && portfolio.education.length > 0) {
    printSectionHeader("Education");
    
    portfolio.education.forEach((edu) => {
      checkPageBreak(30);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(edu.degree, margin, y);
      y += 14;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`${edu.institution}${edu.year ? ` | ${edu.year}` : ""}`, margin, y);
      y += 16;
    });
  }

  return doc;
}

// Generate PDF blob for preview/download
export function generateResumePDFBlob(portfolio: PortfolioData): Blob {
  const doc = generateATSResumePDF(portfolio);
  return doc.output("blob");
}

// Generate data URL for preview
export function generateResumePDFDataUrl(portfolio: PortfolioData): string {
  const doc = generateATSResumePDF(portfolio);
  return doc.output("dataurlstring");
}

// Download the PDF
export function downloadResumePDF(portfolio: PortfolioData, filename: string = "resume.pdf") {
  const doc = generateATSResumePDF(portfolio);
  doc.save(filename);
}

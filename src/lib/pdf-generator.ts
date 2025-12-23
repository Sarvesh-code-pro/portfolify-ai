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

interface PDFConfig {
  pageLimit: 1 | 2;
  margin: number;
  headerFontSize: number;
  sectionFontSize: number;
  bodyFontSize: number;
  lineHeight: number;
  sectionGap: number;
  bulletLineHeight: number;
}

// Content compression strategies
function compressSummary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  let result = "";
  for (const sentence of sentences) {
    const potentialResult = result + sentence.trim() + ". ";
    if (potentialResult.length <= maxChars) {
      result = potentialResult;
    } else break;
  }
  return result.trim() || text.substring(0, maxChars - 3) + "...";
}

function compressBullets(description: string, maxBullets: number): string[] {
  const bullets = description.split(/[•\-\n]/).filter(line => line.trim());
  return bullets.slice(0, maxBullets).map(b => b.trim());
}

function shortenBullet(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  // Try to end at a word boundary
  let truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.7) {
    truncated = truncated.substring(0, lastSpace);
  }
  return truncated + "...";
}

// Calculate content height estimation
function estimateContentHeight(portfolio: PortfolioData, config: PDFConfig, contentWidth: number): number {
  let height = 0;
  
  // Header
  height += config.headerFontSize * 1.2 + config.sectionGap;
  if (portfolio.hero_subtitle) height += config.bodyFontSize * 1.4;
  height += config.bodyFontSize * 1.5; // contacts
  
  // Summary
  if (portfolio.about_text) {
    height += config.sectionFontSize + 20 + 
      Math.ceil(portfolio.about_text.length / 80) * config.bodyFontSize * config.lineHeight;
  }
  
  // Experience
  if (portfolio.experience?.length) {
    height += config.sectionFontSize + 20;
    for (const exp of portfolio.experience) {
      height += config.bodyFontSize * 2.5; // role, company, period
      const bullets = exp.description?.split(/[•\-\n]/).filter(b => b.trim()) || [];
      height += bullets.length * config.bodyFontSize * config.bulletLineHeight * 1.5;
      height += config.sectionGap / 2;
    }
  }
  
  // Skills
  if (portfolio.skills?.length) {
    height += config.sectionFontSize + 20 + config.bodyFontSize * 2;
  }
  
  // Projects
  if (portfolio.projects?.length) {
    height += config.sectionFontSize + 20;
    height += portfolio.projects.length * config.bodyFontSize * 4;
  }
  
  // Education
  if (portfolio.education?.length) {
    height += config.sectionFontSize + 20;
    height += portfolio.education.length * config.bodyFontSize * 2.5;
  }
  
  return height;
}

// Get optimized config based on content
function getOptimalConfig(portfolio: PortfolioData, pageLimit: 1 | 2): PDFConfig {
  const baseConfig: PDFConfig = {
    pageLimit,
    margin: 40,
    headerFontSize: 16,
    sectionFontSize: 11,
    bodyFontSize: 9,
    lineHeight: 1.35,
    sectionGap: 10,
    bulletLineHeight: 1.25,
  };
  
  const pageHeight = 792; // Letter page height in pt
  const contentWidth = 612 - baseConfig.margin * 2;
  const availableHeight = (pageHeight - baseConfig.margin * 2) * pageLimit;
  
  let estimatedHeight = estimateContentHeight(portfolio, baseConfig, contentWidth);
  
  // Progressively compress if needed for one-page
  if (pageLimit === 1 && estimatedHeight > availableHeight) {
    // Level 1: Reduce spacing
    baseConfig.sectionGap = 6;
    baseConfig.lineHeight = 1.25;
    baseConfig.bulletLineHeight = 1.15;
    
    estimatedHeight = estimateContentHeight(portfolio, baseConfig, contentWidth);
    
    if (estimatedHeight > availableHeight) {
      // Level 2: Reduce font sizes
      baseConfig.headerFontSize = 14;
      baseConfig.sectionFontSize = 10;
      baseConfig.bodyFontSize = 8.5;
      baseConfig.margin = 36;
    }
    
    estimatedHeight = estimateContentHeight(portfolio, baseConfig, contentWidth);
    
    if (estimatedHeight > availableHeight) {
      // Level 3: Minimal spacing
      baseConfig.sectionGap = 4;
      baseConfig.lineHeight = 1.2;
      baseConfig.margin = 32;
      baseConfig.bodyFontSize = 8;
    }
  }
  
  return baseConfig;
}

// ATS-friendly PDF generation using structured data only (no HTML conversion)
export function generateATSResumePDF(portfolio: PortfolioData, pageLimit: 1 | 2 = 1): jsPDF {
  const config = getOptimalConfig(portfolio, pageLimit);
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (config.margin * 2);
  let y = config.margin;
  let currentPage = 1;

  // Calculate available content height based on page limit
  const maxContentHeight = pageLimit === 1 
    ? pageHeight - config.margin * 2 
    : (pageHeight - config.margin * 2) * 2;

  // Compression settings based on content density
  const contentDensity = estimateContentHeight(portfolio, config, contentWidth);
  const compressionLevel = contentDensity > maxContentHeight 
    ? (contentDensity > maxContentHeight * 1.5 ? "high" : "medium") 
    : "none";

  const summaryMaxChars = compressionLevel === "high" ? 200 : compressionLevel === "medium" ? 350 : 500;
  const maxBulletsPerRole = compressionLevel === "high" ? 3 : compressionLevel === "medium" ? 4 : 6;
  const bulletMaxLength = compressionLevel === "high" ? 100 : compressionLevel === "medium" ? 140 : 200;

  // Simple black text on white background (ATS requirement)
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);

  // Check if we should add new page (only if pageLimit > 1)
  const checkPageBreak = (neededHeight: number = 30): boolean => {
    if (y + neededHeight > pageHeight - config.margin) {
      if (pageLimit === 1 || currentPage >= pageLimit) {
        return false; // Don't add more content
      }
      doc.addPage();
      currentPage++;
      y = config.margin;
    }
    return true;
  };

  // Helper to wrap and print text
  const printWrappedText = (text: string, fontSize: number, lineHeight: number = config.lineHeight): boolean => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      if (!checkPageBreak(fontSize * lineHeight)) return false;
      doc.text(line, config.margin, y);
      y += fontSize * lineHeight;
    }
    return true;
  };

  // Section header (standard ATS format)
  const printSectionHeader = (title: string): boolean => {
    if (!checkPageBreak(config.sectionFontSize + 16)) return false;
    y += config.sectionGap;
    doc.setFontSize(config.sectionFontSize);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), config.margin, y);
    y += 3;
    doc.setLineWidth(0.5);
    doc.line(config.margin, y, pageWidth - config.margin, y);
    y += config.sectionGap + 4;
    doc.setFont("helvetica", "normal");
    return true;
  };

  // ===== HEADER / NAME =====
  const name = portfolio.hero_title?.split(" - ")[0]?.trim() || "Name";
  const title = portfolio.hero_title?.split(" - ")[1]?.trim() || portfolio.hero_subtitle || "";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(config.headerFontSize);
  doc.text(name, config.margin, y);
  y += config.headerFontSize * 1.2;

  if (title) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(config.bodyFontSize + 1);
    doc.text(title, config.margin, y);
    y += config.bodyFontSize * 1.4;
  }

  // Contact info (single line or stacked)
  const contacts: string[] = [];
  if (portfolio.links?.email) contacts.push(portfolio.links.email);
  if (portfolio.links?.phone) contacts.push(portfolio.links.phone);
  if (portfolio.links?.linkedin) contacts.push(portfolio.links.linkedin.replace("https://", "").replace("www.", ""));
  if (portfolio.links?.github) contacts.push(portfolio.links.github.replace("https://", "").replace("www.", ""));
  if (portfolio.links?.website) contacts.push(portfolio.links.website.replace("https://", "").replace("www.", ""));

  if (contacts.length > 0) {
    doc.setFontSize(config.bodyFontSize);
    const contactText = contacts.join("  |  ");
    const contactLines = doc.splitTextToSize(contactText, contentWidth);
    contactLines.forEach((line: string) => {
      doc.text(line, config.margin, y);
      y += config.bodyFontSize * 1.2;
    });
  }

  y += config.sectionGap / 2;

  // ===== SUMMARY =====
  if (portfolio.about_text) {
    if (!printSectionHeader("Summary")) return doc;
    const cleanAbout = portfolio.about_text.replace(/<[^>]*>/g, "").trim();
    const compressedAbout = compressSummary(cleanAbout, summaryMaxChars);
    if (!printWrappedText(compressedAbout, config.bodyFontSize, config.lineHeight)) return doc;
  }

  // ===== EXPERIENCE =====
  if (portfolio.experience && portfolio.experience.length > 0) {
    if (!printSectionHeader("Experience")) return doc;
    
    for (let i = 0; i < portfolio.experience.length; i++) {
      const exp = portfolio.experience[i];
      if (!checkPageBreak(40)) break;
      
      // Company and Role on same line (bold)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(config.bodyFontSize + 1);
      doc.text(exp.role, config.margin, y);
      
      // Company name (normal)
      doc.setFont("helvetica", "normal");
      const roleWidth = doc.getTextWidth(exp.role);
      doc.text(` | ${exp.company}`, config.margin + roleWidth, y);
      y += config.bodyFontSize * 1.4;

      // Period
      doc.setFontSize(config.bodyFontSize);
      doc.setFont("helvetica", "italic");
      doc.text(exp.period || "", config.margin, y);
      y += config.bodyFontSize * 1.3;
      doc.setFont("helvetica", "normal");

      // Description - split into bullet points if possible
      if (exp.description) {
        const bullets = compressBullets(exp.description, maxBulletsPerRole);
        for (const bullet of bullets) {
          const shortenedBullet = shortenBullet(bullet, bulletMaxLength);
          if (!checkPageBreak(config.bodyFontSize * config.bulletLineHeight)) break;
          
          const bulletText = `• ${shortenedBullet}`;
          const wrappedBullet = doc.splitTextToSize(bulletText, contentWidth - 8);
          for (let idx = 0; idx < wrappedBullet.length; idx++) {
            doc.text(idx === 0 ? wrappedBullet[idx] : `  ${wrappedBullet[idx]}`, config.margin, y);
            y += config.bodyFontSize * config.bulletLineHeight;
          }
        }
      }

      if (i < portfolio.experience.length - 1) {
        y += config.sectionGap / 2;
      }
    }
  }

  // ===== SKILLS =====
  if (portfolio.skills && portfolio.skills.length > 0) {
    if (!printSectionHeader("Skills")) return doc;
    const skillsText = portfolio.skills.join(", ");
    if (!printWrappedText(skillsText, config.bodyFontSize, config.lineHeight)) return doc;
  }

  // ===== PROJECTS ===== (only if space allows)
  if (portfolio.projects && portfolio.projects.length > 0) {
    // Check if we have room for projects section
    const projectsEstimate = 30 + portfolio.projects.length * 40;
    if (checkPageBreak(Math.min(projectsEstimate, 80))) {
      if (printSectionHeader("Projects")) {
        const maxProjects = compressionLevel === "high" ? 2 : compressionLevel === "medium" ? 3 : portfolio.projects.length;
        
        for (let i = 0; i < Math.min(portfolio.projects.length, maxProjects); i++) {
          const project = portfolio.projects[i];
          if (!checkPageBreak(35)) break;
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(config.bodyFontSize + 0.5);
          doc.text(project.title, config.margin, y);
          y += config.bodyFontSize * 1.3;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(config.bodyFontSize);
          
          if (project.description) {
            const shortDesc = shortenBullet(project.description, bulletMaxLength);
            if (!printWrappedText(shortDesc, config.bodyFontSize, config.lineHeight)) break;
          }
          
          if (project.technologies && project.technologies.length > 0) {
            const techText = `Technologies: ${project.technologies.slice(0, 5).join(", ")}`;
            doc.setFont("helvetica", "italic");
            doc.setFontSize(config.bodyFontSize - 0.5);
            doc.text(techText, config.margin, y);
            y += config.bodyFontSize * 1.2;
            doc.setFont("helvetica", "normal");
          }

          if (i < Math.min(portfolio.projects.length, maxProjects) - 1) {
            y += config.sectionGap / 3;
          }
        }
      }
    }
  }

  // ===== EDUCATION =====
  if (portfolio.education && portfolio.education.length > 0) {
    if (checkPageBreak(25)) {
      if (printSectionHeader("Education")) {
        for (const edu of portfolio.education) {
          if (!checkPageBreak(25)) break;
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(config.bodyFontSize + 0.5);
          doc.text(edu.degree, config.margin, y);
          y += config.bodyFontSize * 1.3;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(config.bodyFontSize);
          doc.text(`${edu.institution}${edu.year ? ` | ${edu.year}` : ""}`, config.margin, y);
          y += config.bodyFontSize * 1.4;
        }
      }
    }
  }

  return doc;
}

// Generate PDF blob for preview/download
export function generateResumePDFBlob(portfolio: PortfolioData, pageLimit: 1 | 2 = 1): Blob {
  const doc = generateATSResumePDF(portfolio, pageLimit);
  return doc.output("blob");
}

// Generate data URL for preview
export function generateResumePDFDataUrl(portfolio: PortfolioData, pageLimit: 1 | 2 = 1): string {
  const doc = generateATSResumePDF(portfolio, pageLimit);
  return doc.output("dataurlstring");
}

// Download the PDF
export function downloadResumePDF(portfolio: PortfolioData, filename: string = "resume.pdf", pageLimit: 1 | 2 = 1) {
  const doc = generateATSResumePDF(portfolio, pageLimit);
  doc.save(filename);
}

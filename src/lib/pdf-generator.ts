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

type TemplateStyle = "classic" | "modern" | "minimal" | "professional" | "executive";

interface TemplateConfig {
  headerAlignment: "left" | "center" | "right";
  sectionHeaderStyle: "underline" | "bold" | "uppercase" | "simple" | "boxed" | "line-left" | "background";
  nameStyle: "bold" | "uppercase" | "normal" | "large-caps";
  bulletStyle: "bullet" | "dash" | "arrow" | "square" | "none";
  contactLayout: "inline" | "stacked" | "centered" | "two-column" | "right-aligned";
  sectionSpacing: "compact" | "normal" | "spacious";
  accentLine: boolean;
  headerBorder: boolean;
  sectionDividers: boolean;
  skillsLayout: "inline" | "pills" | "columns";
}

const templateConfigs: Record<TemplateStyle, TemplateConfig> = {
  classic: {
    headerAlignment: "left",
    sectionHeaderStyle: "underline",
    nameStyle: "bold",
    bulletStyle: "bullet",
    contactLayout: "inline",
    sectionSpacing: "normal",
    accentLine: false,
    headerBorder: false,
    sectionDividers: false,
    skillsLayout: "inline",
  },
  modern: {
    headerAlignment: "left",
    sectionHeaderStyle: "line-left",
    nameStyle: "large-caps",
    bulletStyle: "square",
    contactLayout: "two-column",
    sectionSpacing: "compact",
    accentLine: true,
    headerBorder: true,
    sectionDividers: false,
    skillsLayout: "pills",
  },
  minimal: {
    headerAlignment: "center",
    sectionHeaderStyle: "simple",
    nameStyle: "uppercase",
    bulletStyle: "dash",
    contactLayout: "centered",
    sectionSpacing: "spacious",
    accentLine: false,
    headerBorder: false,
    sectionDividers: true,
    skillsLayout: "inline",
  },
  professional: {
    headerAlignment: "left",
    sectionHeaderStyle: "background",
    nameStyle: "bold",
    bulletStyle: "bullet",
    contactLayout: "right-aligned",
    sectionSpacing: "normal",
    accentLine: false,
    headerBorder: true,
    sectionDividers: false,
    skillsLayout: "columns",
  },
  executive: {
    headerAlignment: "center",
    sectionHeaderStyle: "uppercase",
    nameStyle: "large-caps",
    bulletStyle: "arrow",
    contactLayout: "centered",
    sectionSpacing: "spacious",
    accentLine: true,
    headerBorder: false,
    sectionDividers: true,
    skillsLayout: "inline",
  },
};

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
  
  height += config.headerFontSize * 1.2 + config.sectionGap;
  if (portfolio.hero_subtitle) height += config.bodyFontSize * 1.4;
  height += config.bodyFontSize * 1.5;
  
  if (portfolio.about_text) {
    height += config.sectionFontSize + 20 + 
      Math.ceil(portfolio.about_text.length / 80) * config.bodyFontSize * config.lineHeight;
  }
  
  if (portfolio.experience?.length) {
    height += config.sectionFontSize + 20;
    for (const exp of portfolio.experience) {
      height += config.bodyFontSize * 2.5;
      const bullets = exp.description?.split(/[•\-\n]/).filter(b => b.trim()) || [];
      height += bullets.length * config.bodyFontSize * config.bulletLineHeight * 1.5;
      height += config.sectionGap / 2;
    }
  }
  
  if (portfolio.skills?.length) {
    height += config.sectionFontSize + 20 + config.bodyFontSize * 2;
  }
  
  if (portfolio.projects?.length) {
    height += config.sectionFontSize + 20;
    height += portfolio.projects.length * config.bodyFontSize * 4;
  }
  
  if (portfolio.education?.length) {
    height += config.sectionFontSize + 20;
    height += portfolio.education.length * config.bodyFontSize * 2.5;
  }
  
  return height;
}

function getOptimalConfig(portfolio: PortfolioData, pageLimit: 1 | 2, template: TemplateStyle): PDFConfig {
  const templateConf = templateConfigs[template];
  
  const spacingMultiplier = templateConf.sectionSpacing === "spacious" ? 1.3 
    : templateConf.sectionSpacing === "compact" ? 0.8 : 1;

  const baseConfig: PDFConfig = {
    pageLimit,
    margin: 40,
    headerFontSize: template === "executive" ? 18 : template === "minimal" ? 14 : 16,
    sectionFontSize: 11,
    bodyFontSize: 9,
    lineHeight: 1.35 * spacingMultiplier,
    sectionGap: 10 * spacingMultiplier,
    bulletLineHeight: 1.25,
  };
  
  const pageHeight = 792;
  const contentWidth = 612 - baseConfig.margin * 2;
  const availableHeight = (pageHeight - baseConfig.margin * 2) * pageLimit;
  
  let estimatedHeight = estimateContentHeight(portfolio, baseConfig, contentWidth);
  
  if (pageLimit === 1 && estimatedHeight > availableHeight) {
    baseConfig.sectionGap = 6;
    baseConfig.lineHeight = 1.25;
    baseConfig.bulletLineHeight = 1.15;
    
    estimatedHeight = estimateContentHeight(portfolio, baseConfig, contentWidth);
    
    if (estimatedHeight > availableHeight) {
      baseConfig.headerFontSize = 14;
      baseConfig.sectionFontSize = 10;
      baseConfig.bodyFontSize = 8.5;
      baseConfig.margin = 36;
    }
    
    estimatedHeight = estimateContentHeight(portfolio, baseConfig, contentWidth);
    
    if (estimatedHeight > availableHeight) {
      baseConfig.sectionGap = 4;
      baseConfig.lineHeight = 1.2;
      baseConfig.margin = 32;
      baseConfig.bodyFontSize = 8;
    }
  }
  
  return baseConfig;
}

function getBulletChar(style: TemplateConfig["bulletStyle"]): string {
  switch (style) {
    case "dash": return "–";
    case "arrow": return "›";
    case "square": return "▪";
    case "none": return "";
    default: return "•";
  }
}

// ATS-friendly PDF generation with template support
export function generateATSResumePDF(
  portfolio: PortfolioData, 
  pageLimit: 1 | 2 = 1,
  template: TemplateStyle = "classic"
): jsPDF {
  const config = getOptimalConfig(portfolio, pageLimit, template);
  const templateConf = templateConfigs[template];
  
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

  const maxContentHeight = pageLimit === 1 
    ? pageHeight - config.margin * 2 
    : (pageHeight - config.margin * 2) * 2;

  const contentDensity = estimateContentHeight(portfolio, config, contentWidth);
  const compressionLevel = contentDensity > maxContentHeight 
    ? (contentDensity > maxContentHeight * 1.5 ? "high" : "medium") 
    : "none";

  const summaryMaxChars = compressionLevel === "high" ? 200 : compressionLevel === "medium" ? 350 : 500;
  const maxBulletsPerRole = compressionLevel === "high" ? 3 : compressionLevel === "medium" ? 4 : 6;
  const bulletMaxLength = compressionLevel === "high" ? 100 : compressionLevel === "medium" ? 140 : 200;

  doc.setTextColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);

  const checkPageBreak = (neededHeight: number = 30): boolean => {
    if (y + neededHeight > pageHeight - config.margin) {
      if (pageLimit === 1 || currentPage >= pageLimit) {
        return false;
      }
      doc.addPage();
      currentPage++;
      y = config.margin;
    }
    return true;
  };

  const printWrappedText = (text: string, fontSize: number, lineHeight: number = config.lineHeight, align: "left" | "center" = "left"): boolean => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      if (!checkPageBreak(fontSize * lineHeight)) return false;
      const xPos = align === "center" ? pageWidth / 2 : config.margin;
      doc.text(line, xPos, y, { align });
      y += fontSize * lineHeight;
    }
    return true;
  };

  const printSectionHeader = (title: string): boolean => {
    if (!checkPageBreak(config.sectionFontSize + 16)) return false;
    y += config.sectionGap;
    
    // Add section divider if enabled
    if (templateConf.sectionDividers) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(config.margin, y - 2, pageWidth - config.margin, y - 2);
      doc.setDrawColor(0, 0, 0);
      y += 4;
    }
    
    doc.setFontSize(config.sectionFontSize);
    doc.setFont("helvetica", "bold");
    
    const headerText = templateConf.sectionHeaderStyle === "uppercase" 
      ? title.toUpperCase() 
      : title;
    
    // Handle different section header styles
    if (templateConf.sectionHeaderStyle === "line-left") {
      // Vertical line before text
      doc.setLineWidth(2);
      doc.setDrawColor(60, 60, 60);
      doc.line(config.margin, y - config.sectionFontSize + 3, config.margin, y + 2);
      doc.setDrawColor(0, 0, 0);
      doc.text(headerText, config.margin + 8, y);
    } else if (templateConf.sectionHeaderStyle === "background") {
      // Gray background behind text
      const textWidth = doc.getTextWidth(headerText);
      doc.setFillColor(240, 240, 240);
      doc.rect(config.margin, y - config.sectionFontSize + 2, contentWidth, config.sectionFontSize + 6, "F");
      doc.setFillColor(255, 255, 255);
      doc.text(headerText, config.margin + 4, y);
    } else {
      const xPos = templateConf.headerAlignment === "center" ? pageWidth / 2 : 
                   templateConf.headerAlignment === "right" ? pageWidth - config.margin : config.margin;
      const align = templateConf.headerAlignment === "center" ? "center" : 
                    templateConf.headerAlignment === "right" ? "right" : "left";
      doc.text(headerText, xPos, y, { align });
    }
    
    if (templateConf.sectionHeaderStyle === "underline") {
      y += 3;
      doc.setLineWidth(0.5);
      doc.line(config.margin, y, pageWidth - config.margin, y);
    } else if (templateConf.sectionHeaderStyle === "boxed") {
      const textWidth = doc.getTextWidth(headerText);
      const boxX = templateConf.headerAlignment === "center" 
        ? (pageWidth - textWidth) / 2 - 4 
        : config.margin - 4;
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.roundedRect(boxX, y - config.sectionFontSize + 2, textWidth + 8, config.sectionFontSize + 4, 2, 2, "S");
      doc.setDrawColor(0, 0, 0);
    }
    
    y += config.sectionGap + 4;
    doc.setFont("helvetica", "normal");
    return true;
  };

  // ===== HEADER / NAME =====
  const name = portfolio.hero_title?.split(" - ")[0]?.trim() || "Name";
  const title = portfolio.hero_title?.split(" - ")[1]?.trim() || portfolio.hero_subtitle || "";

  // Draw accent line at top if enabled (modern template)
  if (templateConf.accentLine) {
    doc.setFillColor(40, 40, 40);
    doc.rect(0, 0, pageWidth, 4, "F");
    doc.setFillColor(255, 255, 255);
  }

  // Draw header border if enabled
  if (templateConf.headerBorder) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    const borderY = y + config.headerFontSize * 2 + (title ? config.bodyFontSize * 1.5 : 0) + 10;
    doc.line(config.margin, borderY, pageWidth - config.margin, borderY);
    doc.setDrawColor(0, 0, 0);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(templateConf.nameStyle === "large-caps" ? config.headerFontSize + 4 : config.headerFontSize);
  
  const displayName = (templateConf.nameStyle === "uppercase" || templateConf.nameStyle === "large-caps") 
    ? name.toUpperCase() : name;
  
  const nameAlign = templateConf.headerAlignment;
  const nameX = nameAlign === "center" ? pageWidth / 2 : 
                nameAlign === "right" ? pageWidth - config.margin : config.margin;
  
  // Add letter spacing for large-caps style
  if (templateConf.nameStyle === "large-caps") {
    doc.setCharSpace(1.5);
  }
  
  doc.text(displayName, nameX, y, { 
    align: nameAlign === "center" ? "center" : nameAlign === "right" ? "right" : "left" 
  });
  doc.setCharSpace(0);
  y += config.headerFontSize * 1.3;

  if (title) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(config.bodyFontSize + 1);
    doc.text(title, nameX, y, { 
      align: nameAlign === "center" ? "center" : nameAlign === "right" ? "right" : "left" 
    });
    y += config.bodyFontSize * 1.4;
  }

  // Contact info
  const contacts: string[] = [];
  if (portfolio.links?.email) contacts.push(portfolio.links.email);
  if (portfolio.links?.phone) contacts.push(portfolio.links.phone);
  if (portfolio.links?.linkedin) contacts.push(portfolio.links.linkedin.replace("https://", "").replace("www.", ""));
  if (portfolio.links?.github) contacts.push(portfolio.links.github.replace("https://", "").replace("www.", ""));
  if (portfolio.links?.website) contacts.push(portfolio.links.website.replace("https://", "").replace("www.", ""));

  if (contacts.length > 0) {
    doc.setFontSize(config.bodyFontSize);
    
    if (templateConf.contactLayout === "stacked") {
      for (const contact of contacts) {
        doc.text(contact, config.margin, y);
        y += config.bodyFontSize * 1.1;
      }
    } else if (templateConf.contactLayout === "two-column") {
      // Two column layout: name/title on left, contacts on right
      const contactText = contacts.join("  |  ");
      const contactLines = doc.splitTextToSize(contactText, contentWidth * 0.65);
      contactLines.forEach((line: string) => {
        doc.text(line, pageWidth - config.margin, y - config.headerFontSize * 0.5, { align: "right" });
        y += config.bodyFontSize * 1.1;
      });
      y -= contactLines.length * config.bodyFontSize * 1.1; // Reset y since we drew above
    } else if (templateConf.contactLayout === "right-aligned") {
      // Right-aligned contact info
      const contactText = contacts.join("  |  ");
      const contactLines = doc.splitTextToSize(contactText, contentWidth);
      contactLines.forEach((line: string) => {
        doc.text(line, pageWidth - config.margin, y, { align: "right" });
        y += config.bodyFontSize * 1.2;
      });
    } else {
      const separator = templateConf.contactLayout === "centered" ? "  ·  " : "  |  ";
      const contactText = contacts.join(separator);
      const contactLines = doc.splitTextToSize(contactText, contentWidth);
      const contactAlign = templateConf.contactLayout === "centered" ? "center" : "left";
      const contactX = contactAlign === "center" ? pageWidth / 2 : config.margin;
      
      contactLines.forEach((line: string) => {
        doc.text(line, contactX, y, { align: contactAlign === "center" ? "center" : "left" });
        y += config.bodyFontSize * 1.2;
      });
    }
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
    
    const bulletChar = getBulletChar(templateConf.bulletStyle);
    
    for (let i = 0; i < portfolio.experience.length; i++) {
      const exp = portfolio.experience[i];
      if (!checkPageBreak(40)) break;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(config.bodyFontSize + 1);
      doc.text(exp.role, config.margin, y);
      
      doc.setFont("helvetica", "normal");
      const roleWidth = doc.getTextWidth(exp.role);
      doc.text(` | ${exp.company}`, config.margin + roleWidth, y);
      y += config.bodyFontSize * 1.4;

      doc.setFontSize(config.bodyFontSize);
      doc.setFont("helvetica", "italic");
      doc.text(exp.period || "", config.margin, y);
      y += config.bodyFontSize * 1.3;
      doc.setFont("helvetica", "normal");

      if (exp.description) {
        const bullets = compressBullets(exp.description, maxBulletsPerRole);
        for (const bullet of bullets) {
          const shortenedBullet = shortenBullet(bullet, bulletMaxLength);
          if (!checkPageBreak(config.bodyFontSize * config.bulletLineHeight)) break;
          
          const bulletText = `${bulletChar} ${shortenedBullet}`;
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

  // ===== PROJECTS =====
  if (portfolio.projects && portfolio.projects.length > 0) {
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
export function generateResumePDFBlob(portfolio: PortfolioData, pageLimit: 1 | 2 = 1, template: TemplateStyle = "classic"): Blob {
  const doc = generateATSResumePDF(portfolio, pageLimit, template);
  return doc.output("blob");
}

// Generate data URL for preview
export function generateResumePDFDataUrl(portfolio: PortfolioData, pageLimit: 1 | 2 = 1, template: TemplateStyle = "classic"): string {
  const doc = generateATSResumePDF(portfolio, pageLimit, template);
  return doc.output("dataurlstring");
}

// Download the PDF
export function downloadResumePDF(portfolio: PortfolioData, filename: string = "resume.pdf", pageLimit: 1 | 2 = 1, template: TemplateStyle = "classic") {
  const doc = generateATSResumePDF(portfolio, pageLimit, template);
  doc.save(filename);
}

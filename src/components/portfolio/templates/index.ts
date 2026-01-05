// Portfolio Template Definitions
// Each template defines a unique visual approach with different layouts, spacing, and styling

export interface PortfolioTemplateConfig {
  id: string;
  name: string;
  description: string;
  // Layout
  heroLayout: "centered" | "left-aligned" | "split" | "minimal" | "bold";
  sectionLayout: "cards" | "timeline" | "grid" | "list" | "minimal";
  // Spacing
  spacing: "compact" | "normal" | "spacious";
  // Visual style
  borderRadius: "none" | "subtle" | "rounded" | "full";
  shadowStyle: "none" | "subtle" | "medium" | "dramatic";
  // Typography
  headingStyle: "bold" | "light" | "uppercase" | "mixed";
  // Colors (applied via CSS classes)
  accentStyle: "gradient" | "solid" | "subtle" | "minimal";
}

export const portfolioTemplates: Record<string, PortfolioTemplateConfig> = {
  developer: {
    id: "developer",
    name: "Developer",
    description: "Clean, code-focused layout with terminal aesthetics",
    heroLayout: "centered",
    sectionLayout: "cards",
    spacing: "normal",
    borderRadius: "rounded",
    shadowStyle: "subtle",
    headingStyle: "bold",
    accentStyle: "gradient",
  },
  designer: {
    id: "designer",
    name: "Designer",
    description: "Visual-first with large imagery and creative spacing",
    heroLayout: "split",
    sectionLayout: "grid",
    spacing: "spacious",
    borderRadius: "full",
    shadowStyle: "medium",
    headingStyle: "light",
    accentStyle: "gradient",
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean with maximum whitespace and focus",
    heroLayout: "minimal",
    sectionLayout: "minimal",
    spacing: "spacious",
    borderRadius: "none",
    shadowStyle: "none",
    headingStyle: "light",
    accentStyle: "minimal",
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "Corporate look with structured sections",
    heroLayout: "left-aligned",
    sectionLayout: "timeline",
    spacing: "normal",
    borderRadius: "subtle",
    shadowStyle: "subtle",
    headingStyle: "uppercase",
    accentStyle: "solid",
  },
  bold: {
    id: "bold",
    name: "Bold",
    description: "High-impact with dramatic typography and colors",
    heroLayout: "bold",
    sectionLayout: "cards",
    spacing: "compact",
    borderRadius: "rounded",
    shadowStyle: "dramatic",
    headingStyle: "bold",
    accentStyle: "gradient",
  },
  elegant: {
    id: "elegant",
    name: "Elegant",
    description: "Refined aesthetic with subtle animations",
    heroLayout: "centered",
    sectionLayout: "list",
    spacing: "spacious",
    borderRadius: "subtle",
    shadowStyle: "subtle",
    headingStyle: "mixed",
    accentStyle: "subtle",
  },
};

export function getTemplateConfig(templateId: string): PortfolioTemplateConfig {
  return portfolioTemplates[templateId] || portfolioTemplates.developer;
}

// CSS class helpers based on template config
export function getTemplateClasses(config: PortfolioTemplateConfig) {
  const borderRadiusMap = {
    none: "",
    subtle: "rounded-lg",
    rounded: "rounded-2xl",
    full: "rounded-3xl",
  };

  const shadowMap = {
    none: "",
    subtle: "shadow-sm",
    medium: "shadow-lg",
    dramatic: "shadow-2xl",
  };

  const spacingMap = {
    compact: "gap-8 py-12",
    normal: "gap-12 py-16",
    spacious: "gap-20 py-24",
  };

  return {
    borderRadius: borderRadiusMap[config.borderRadius],
    shadow: shadowMap[config.shadowStyle],
    spacing: spacingMap[config.spacing],
  };
}

/**
 * AI Action Executor
 * 
 * This module validates and applies structured AI actions to portfolio data.
 * It ensures type safety and provides undo/redo capabilities.
 */

import type { 
  PortfolioAction, 
  AIEditPlan,
  ReorderSectionsAction,
  ToggleSectionVisibilityAction,
  UpdateSectionTitleAction,
  UpdateContentAction,
  UpdateThemeAction,
  AddSectionAction,
  UpdateLayoutAction,
  BatchUpdateAction,
  DEFAULT_SECTION_ORDER
} from '@/types/ai-portfolio-actions';
import type { Portfolio, SectionVisibility, SectionTitles } from '@/types/portfolio';

export interface ExecutionResult {
  success: boolean;
  updates: Partial<Portfolio>;
  errors: string[];
  warnings: string[];
}

export interface SnapshotDiff {
  before: Partial<Portfolio>;
  after: Partial<Portfolio>;
}

/**
 * Validates that section IDs are valid
 */
function validateSectionIds(sectionIds: string[]): boolean {
  const validSections = new Set([
    'hero', 'about', 'skills', 'experience', 'projects', 
    'education', 'testimonials', 'certificates', 'contact'
  ]);
  return sectionIds.every(id => validSections.has(id) || id.startsWith('custom_'));
}

/**
 * Validates a hex color code
 */
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validates an HSL color
 */
function isValidHslColor(color: string): boolean {
  return /^hsl\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/.test(color);
}

/**
 * Validates a color (hex or HSL)
 */
function isValidColor(color: string): boolean {
  return isValidHexColor(color) || isValidHslColor(color);
}

/**
 * Execute a single action and return the portfolio updates
 */
function executeAction(
  action: PortfolioAction, 
  currentPortfolio: Portfolio
): ExecutionResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let updates: Partial<Portfolio> = {};

  switch (action.type) {
    case 'reorder_sections': {
      const reorderAction = action as ReorderSectionsAction;
      if (!validateSectionIds(reorderAction.newOrder)) {
        errors.push('Invalid section IDs in reorder action');
        break;
      }
      updates.section_order = reorderAction.newOrder;
      break;
    }

    case 'toggle_section_visibility': {
      const visAction = action as ToggleSectionVisibilityAction;
      const currentVisibility = currentPortfolio.section_visibility || {};
      updates.section_visibility = {
        ...currentVisibility,
        [visAction.sectionId]: visAction.visible
      } as SectionVisibility;
      break;
    }

    case 'update_section_title': {
      const titleAction = action as UpdateSectionTitleAction;
      if (!titleAction.newTitle.trim()) {
        errors.push('Section title cannot be empty');
        break;
      }
      const currentTitles = currentPortfolio.section_titles || {};
      updates.section_titles = {
        ...currentTitles,
        [titleAction.sectionId]: titleAction.newTitle
      } as SectionTitles;
      break;
    }

    case 'update_content': {
      const contentAction = action as UpdateContentAction;
      const contentUpdates = contentAction.updates;
      
      if (contentUpdates.hero_title !== undefined) {
        updates.hero_title = contentUpdates.hero_title;
      }
      if (contentUpdates.hero_subtitle !== undefined) {
        updates.hero_subtitle = contentUpdates.hero_subtitle;
      }
      if (contentUpdates.about_text !== undefined) {
        updates.about_text = contentUpdates.about_text;
      }
      if (contentUpdates.skills !== undefined) {
        if (!Array.isArray(contentUpdates.skills)) {
          errors.push('Skills must be an array');
        } else {
          updates.skills = contentUpdates.skills.filter(s => typeof s === 'string' && s.trim());
        }
      }
      if (contentUpdates.experience !== undefined) {
        if (!Array.isArray(contentUpdates.experience)) {
          errors.push('Experience must be an array');
        } else {
          updates.experience = contentUpdates.experience.map(exp => ({
            company: exp.company || '',
            role: exp.role || '',
            period: exp.period || '',
            description: exp.description || ''
          }));
        }
      }
      if (contentUpdates.projects !== undefined) {
        if (!Array.isArray(contentUpdates.projects)) {
          errors.push('Projects must be an array');
        } else {
          updates.projects = contentUpdates.projects.map(proj => ({
            id: crypto.randomUUID(),
            title: proj.title || '',
            description: proj.description || '',
            technologies: proj.technologies || [],
            link: proj.link || '',
            images: [],
            featured_image: undefined
          }));
        }
      }
      if (contentUpdates.testimonials !== undefined) {
        if (!Array.isArray(contentUpdates.testimonials)) {
          errors.push('Testimonials must be an array');
        } else {
          updates.testimonials = contentUpdates.testimonials.map(test => ({
            id: crypto.randomUUID(),
            name: test.name || '',
            role: test.role || '',
            company: test.company,
            content: test.content || ''
          }));
        }
      }
      break;
    }

    case 'update_theme': {
      const themeAction = action as UpdateThemeAction;
      const currentTheme = currentPortfolio.theme || {
        primaryColor: '#3B82F6',
        backgroundColor: '#0F172A',
        textColor: '#F8FAFC'
      };
      
      const newTheme = { ...currentTheme };
      
      if (themeAction.theme.primaryColor) {
        if (isValidColor(themeAction.theme.primaryColor)) {
          newTheme.primaryColor = themeAction.theme.primaryColor;
        } else {
          warnings.push('Invalid primary color format, skipping');
        }
      }
      if (themeAction.theme.backgroundColor) {
        if (isValidColor(themeAction.theme.backgroundColor)) {
          newTheme.backgroundColor = themeAction.theme.backgroundColor;
        } else {
          warnings.push('Invalid background color format, skipping');
        }
      }
      if (themeAction.theme.textColor) {
        if (isValidColor(themeAction.theme.textColor)) {
          newTheme.textColor = themeAction.theme.textColor;
        } else {
          warnings.push('Invalid text color format, skipping');
        }
      }
      
      updates.theme = newTheme;
      
      if (themeAction.colorMode) {
        updates.color_mode = themeAction.colorMode;
      }
      break;
    }

    case 'add_section': {
      const addAction = action as AddSectionAction;
      const currentCustomSections = currentPortfolio.custom_sections || [];
      updates.custom_sections = [
        ...currentCustomSections,
        {
          id: `custom_${crypto.randomUUID()}`,
          title: addAction.title,
          content: addAction.content,
          media: [],
          links: []
        }
      ];
      break;
    }

    case 'update_layout': {
      const layoutAction = action as UpdateLayoutAction;
      const validTemplates = ['minimal', 'professional', 'creative', 'developer', 'elegant'];
      if (!validTemplates.includes(layoutAction.template)) {
        warnings.push(`Unknown template "${layoutAction.template}", using current`);
      } else {
        updates.template = layoutAction.template;
      }
      break;
    }

    case 'batch_update': {
      const batchAction = action as BatchUpdateAction;
      for (const subAction of batchAction.actions) {
        const subResult = executeAction(subAction, { ...currentPortfolio, ...updates });
        updates = { ...updates, ...subResult.updates };
        errors.push(...subResult.errors);
        warnings.push(...subResult.warnings);
      }
      break;
    }

    default:
      errors.push(`Unknown action type: ${(action as any).type}`);
  }

  return {
    success: errors.length === 0,
    updates,
    errors,
    warnings
  };
}

/**
 * Execute an AI edit plan and return the combined result
 */
export function executeAIPlan(
  plan: AIEditPlan,
  currentPortfolio: Portfolio
): ExecutionResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  let combinedUpdates: Partial<Portfolio> = {};

  for (const action of plan.actions) {
    const result = executeAction(action, { ...currentPortfolio, ...combinedUpdates });
    combinedUpdates = { ...combinedUpdates, ...result.updates };
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    success: allErrors.length === 0,
    updates: combinedUpdates,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Create a snapshot diff for undo/redo functionality
 */
export function createSnapshotDiff(
  currentPortfolio: Portfolio,
  updates: Partial<Portfolio>
): SnapshotDiff {
  const before: Partial<Portfolio> = {};
  const after: Partial<Portfolio> = {};

  for (const key of Object.keys(updates)) {
    const k = key as keyof Portfolio;
    (before as Record<string, unknown>)[k] = currentPortfolio[k];
    (after as Record<string, unknown>)[k] = updates[k];
  }

  return { before, after };
}

/**
 * Merge portfolio updates safely
 */
export function mergePortfolioUpdates(
  current: Portfolio,
  updates: Partial<Portfolio>
): Portfolio {
  return {
    ...current,
    ...updates,
    // Ensure arrays don't get overwritten with undefined
    skills: updates.skills ?? current.skills,
    projects: updates.projects ?? current.projects,
    experience: updates.experience ?? current.experience,
    testimonials: updates.testimonials ?? current.testimonials,
    custom_sections: updates.custom_sections ?? current.custom_sections,
    section_order: updates.section_order ?? current.section_order,
    section_visibility: updates.section_visibility ?? current.section_visibility,
    section_titles: updates.section_titles ?? current.section_titles
  };
}

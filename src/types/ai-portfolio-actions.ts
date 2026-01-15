/**
 * AI Portfolio Actions Schema
 * 
 * This file defines the structured actions that the AI can perform on a portfolio.
 * The AI generates these action objects, which are then validated and applied by the executor.
 */

export type ActionType = 
  | 'reorder_sections'
  | 'toggle_section_visibility'
  | 'update_section_title'
  | 'update_content'
  | 'update_theme'
  | 'add_section'
  | 'remove_section'
  | 'update_layout'
  | 'batch_update';

export interface BaseAction {
  type: ActionType;
  reasoning?: string; // AI explains why this change is being made
}

export interface ReorderSectionsAction extends BaseAction {
  type: 'reorder_sections';
  newOrder: string[]; // Array of section IDs in new order
}

export interface ToggleSectionVisibilityAction extends BaseAction {
  type: 'toggle_section_visibility';
  sectionId: string;
  visible: boolean;
}

export interface UpdateSectionTitleAction extends BaseAction {
  type: 'update_section_title';
  sectionId: string;
  newTitle: string;
}

export interface UpdateContentAction extends BaseAction {
  type: 'update_content';
  updates: {
    hero_title?: string;
    hero_subtitle?: string;
    about_text?: string;
    skills?: string[];
    experience?: Array<{
      company: string;
      role: string;
      period: string;
      description: string;
    }>;
    projects?: Array<{
      title: string;
      description: string;
      technologies?: string[];
      link?: string;
    }>;
    testimonials?: Array<{
      name: string;
      role: string;
      company?: string;
      content: string;
    }>;
  };
}

export interface UpdateThemeAction extends BaseAction {
  type: 'update_theme';
  theme: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  colorMode?: 'light' | 'dark';
}

export interface AddSectionAction extends BaseAction {
  type: 'add_section';
  sectionType: 'custom';
  title: string;
  content: string;
}

export interface RemoveSectionAction extends BaseAction {
  type: 'remove_section';
  sectionId: string;
}

export interface UpdateLayoutAction extends BaseAction {
  type: 'update_layout';
  template: string; // Template name
}

export interface BatchUpdateAction extends BaseAction {
  type: 'batch_update';
  actions: PortfolioAction[];
}

export type PortfolioAction = 
  | ReorderSectionsAction
  | ToggleSectionVisibilityAction
  | UpdateSectionTitleAction
  | UpdateContentAction
  | UpdateThemeAction
  | AddSectionAction
  | RemoveSectionAction
  | UpdateLayoutAction
  | BatchUpdateAction;

export interface AIEditPlan {
  summary: string;
  actions: PortfolioAction[];
  confidence: 'high' | 'medium' | 'low';
}

export interface AIEditResult {
  success: boolean;
  plan: AIEditPlan;
  appliedChanges: Record<string, any>;
  errors?: string[];
}

// Default section order for portfolios
export const DEFAULT_SECTION_ORDER = [
  'hero',
  'about', 
  'skills',
  'experience',
  'projects',
  'education',
  'testimonials',
  'certificates',
  'contact'
];

// Section display names for AI context
export const SECTION_DISPLAY_NAMES: Record<string, string> = {
  hero: 'Hero/Header',
  about: 'About Me',
  skills: 'Skills & Technologies',
  experience: 'Work Experience',
  projects: 'Projects & Portfolio',
  education: 'Education',
  testimonials: 'Testimonials',
  certificates: 'Certifications',
  contact: 'Contact Information'
};

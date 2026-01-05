// User Roles
export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  READER: 'reader',
};

// View names for navigation
export const VIEWS = {
  DASHBOARD: 'dashboard',
  ARTICLE: 'article',
  ADD: 'add',
  EDIT: 'edit',
};

// Settings tabs
export const SETTINGS_TABS = {
  DATABASE: 'database',
  KEYWORDS: 'keywords',
  APPEARANCES: 'appearances',
  PROFILE: 'profile',
  USERS: 'users',
  LOGS: 'logs',
  ABOUT: 'about',
};

// Entry form tabs
export const ENTRY_FORM_TABS = {
  WRITE: 'write',
  PREVIEW: 'preview',
  INFOBOX: 'infobox',
  SNAPSHOT: 'snapshot',
};

// Entry form modes
export const ENTRY_FORM_MODES = {
  CREATE: 'create',
  EDIT: 'edit',
};

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Font size options
export const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
};

// Sidebar positions
export const SIDEBAR_POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right',
};

// Content width options
export const CONTENT_WIDTHS = {
  NARROW: 'narrow',
  MEDIUM: 'medium',
  WIDE: 'wide',
};

// Spacing options
export const SPACING_OPTIONS = {
  COMPACT: 'compact',
  COMFORTABLE: 'comfortable',
  SPACIOUS: 'spacious',
};

// Default view options
export const DEFAULT_VIEWS = {
  DASHBOARD: 'dashboard',
  LAST_VIEWED: 'lastViewed',
};

// History entry types
export const HISTORY_TYPES = {
  ARTICLE: 'article',
};

// Debounce delays (in milliseconds)
export const DEBOUNCE = {
  SEARCH: 300,
  HASHTAG: 300,
};

// UI constraints
export const UI = {
  SIDEBAR_MIN_WIDTH: 250,
  SIDEBAR_MAX_WIDTH: 800,
  SIDEBAR_DEFAULT_WIDTH: 350,
  SEARCH_MIN_CHARS: 1,
  DASHBOARD_SEARCH_MIN_CHARS: 2,
  AUTOCOMPLETE_MAX_RESULTS: 5,
};

// Helper functions
export const canEdit = (role) => [ROLES.ADMIN, ROLES.EDITOR].includes(role);
export const isAdmin = (role) => role === ROLES.ADMIN;

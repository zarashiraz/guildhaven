// ============================================================
// GUILDHAVEN DATA CONTRACT (mock for now).
// The Supabase tables should match these shapes, with the same
// snake_case field names, so swapping mock for real data is just
// changing where the data comes from.
// ============================================================

// Table: profiles (one row per player)
// Level is NOT stored. It is calculated from xp (see src/utils/xp.js).
export const mockPlayer = {
  id: 'mock-user-1',
  username: 'Zara',
  career: 'swe', // 'swe' | 'uxui' | 'business'
  avatar: 'avatar-1', // avatar id string, mapped to a pixel sprite in the frontend
  xp: 240,
};

// Frontend-only config. Not in the database.
export const careers = [
  { id: 'swe', name: 'Software Engineering', building: 'Code Workshop', blurb: 'Build software and automation skills.' },
  { id: 'business', name: 'Business', building: 'Market Hall', blurb: 'Practice running and growing a business.' },
  { id: 'data_science', name: 'Data Science', building: 'Data Lab', blurb: 'Turn raw data into useful insights.' },
];

// Table: skills
export const mockSkills = [
  { id: 1, name: 'JavaScript', career: 'swe' },
  { id: 2, name: 'Git & Version Control', career: 'swe' },
  { id: 3, name: 'Wireframing', career: 'uxui' },
  { id: 4, name: 'Accessibility', career: 'uxui' },
  { id: 5, name: 'Budgeting', career: 'business' },
  { id: 6, name: 'Customer Service', career: 'business' },
];

// TEMPORARY: stand-ins until the Village reads quests from Supabase.
// ids match the plan: 1-3 SWE, 4-6 Business, 7-9 Data Science.
export const mockQuests = [
  { id: 1, career: 'swe' }, { id: 2, career: 'swe' }, { id: 3, career: 'swe' },
  { id: 4, career: 'business' }, { id: 5, career: 'business' }, { id: 6, career: 'business' },
  { id: 7, career: 'data_science' }, { id: 8, career: 'data-science' }, { id: 9, career: 'data-science' },
];

// Table: user_quests (which quests THIS player has finished)
export const mockCompletedQuests = [];
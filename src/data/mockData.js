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
  { id: 'uxui', name: 'UI/UX Design', building: 'Design Studio', blurb: 'Learn to design interfaces people love.' },
  { id: 'business', name: 'Business', building: 'Market Hall', blurb: 'Practice running and growing a business.' },
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

// Table: quests (the same for every player)
// minigame = which mini-game component the frontend loads.
export const mockQuests = [
  { id: 'q1', title: 'Program the Robot', description: 'Give the robot the right commands to reach the goal.', career: 'swe', skill_id: 1, xp_reward: 100, minigame: 'robot' },
  { id: 'q2', title: 'Fix the Merge Conflict', description: 'Resolve two clashing versions of the same file.', career: 'swe', skill_id: 2, xp_reward: 120, minigame: 'merge' },
  { id: 'q3', title: 'Rescue the Bad Interface', description: 'Spot and fix the usability problems.', career: 'uxui', skill_id: 4, xp_reward: 100, minigame: 'interface' },
  { id: 'q4', title: 'Sketch the Booking Flow', description: 'Arrange the screens in a sensible order.', career: 'uxui', skill_id: 3, xp_reward: 120, minigame: 'wireframe' },
  { id: 'q5', title: 'Run the Village Shop', description: 'Balance prices and stock for a week.', career: 'business', skill_id: 5, xp_reward: 100, minigame: 'shop' },
  { id: 'q6', title: 'Handle the Angry Customer', description: 'Pick the replies that calm things down.', career: 'business', skill_id: 6, xp_reward: 120, minigame: 'customer' },
];

// Table: user_quests (which quests THIS player has finished)
export const mockCompletedQuests = [];
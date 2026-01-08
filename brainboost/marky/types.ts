export enum View {
  HOME = 'HOME',
  DASHBOARD = 'DASHBOARD',
  GAME_MEMORY = 'GAME_MEMORY',
  GAME_SPEED = 'GAME_SPEED',
  GAME_FOCUS = 'GAME_FOCUS',
  PROFILE = 'PROFILE',
  AUTH = 'AUTH'
}

export interface GameSession {
  id: string;
  gameType: string;
  score: number;
  date: string;
  accuracy: number; // percentage 0-100
  levelReached: number;
}

export interface UserStats {
  totalScore: number;
  streakDays: number;
  gamesPlayed: number;
  history: GameSession[];
}

export interface AIFeedback {
  summary: string;
  tip: string;
  strength: string;
  areaForImprovement: string;
}

export interface UserProfile {
  name: string;
  grade: string;
  joinedDate: string;
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}
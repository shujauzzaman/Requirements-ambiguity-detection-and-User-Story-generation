
export enum AuthMode {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  RESET = 'RESET'
}

export interface User {
  email: string;
  name: string;
}

export enum MessageRole {
  USER = 'USER',
  AI = 'AI'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  type?: 'analysis' | 'clarification' | 'story' | 'text';
}

export interface AmbiguityResult {
  isAmbiguous: boolean;
  clarifications: string[];
  userStory?: string;
  summary: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

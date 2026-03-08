export interface Topic {
  id: string;
  title: string;
  description: string;
  content: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  order: number;
}

export interface UserProgress {
  completedTopics: string[];
  questionsAsked: string[];
  currentTopicId: string | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

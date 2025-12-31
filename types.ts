export enum Sender {
  User = 'user',
  AI = 'ai'
}

export type AttachmentType = 'image' | 'audio';

export interface Attachment {
  type: AttachmentType;
  mimeType: string;
  data: string; // Base64 string
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: Attachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
}

export interface UserProfile {
  username: string; // Unique ID
  name: string;
  avatar: string; // Emoji or URL
  password?: string; // Stored locally for this demo
}
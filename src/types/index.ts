export interface User {
  id: string;
  name: string;
  tag: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  user1Id: string;
  user2Id: string;
  messages: Message[];
  keepChat: boolean;
  expiresAt: Date;
}

export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  timestamp: Date;
}

export interface ScanEvent {
  id: string;
  userId: string;
  scannedBy: string;
  timestamp: Date;
} 
import { User, Connection, Chat, ScanEvent } from '../types';

export const currentUser: User = {
  id: '1',
  name: 'John Doe',
  tag: '@johndoe',
  avatarUrl: 'https://i.pravatar.cc/150?img=1'
};

export const mockUsers: User[] = [
  currentUser,
  {
    id: '2',
    name: 'Jane Smith',
    tag: '@janesmith',
    avatarUrl: 'https://i.pravatar.cc/150?img=2'
  },
  {
    id: '3',
    name: 'Bob Wilson',
    tag: '@bobwilson',
    avatarUrl: 'https://i.pravatar.cc/150?img=3'
  }
];

export const mockConnections: Connection[] = [
  {
    id: '1',
    userId: '1',
    connectedUserId: '2',
    timestamp: new Date('2024-05-07T10:00:00')
  },
  {
    id: '2',
    userId: '1',
    connectedUserId: '3',
    timestamp: new Date('2024-05-06T15:30:00')
  }
];

export const mockChats: Chat[] = [
  {
    id: '1',
    user1Id: '1',
    user2Id: '2',
    messages: [
      {
        id: '1',
        senderId: '1',
        content: 'Hey, nice to meet you!',
        timestamp: new Date('2024-05-07T10:01:00')
      },
      {
        id: '2',
        senderId: '2',
        content: 'Nice to meet you too!',
        timestamp: new Date('2024-05-07T10:02:00')
      }
    ],
    keepChat: false,
    expiresAt: new Date('2024-05-14T10:00:00')
  }
];

export const mockScanEvents: ScanEvent[] = [
  {
    id: '1',
    userId: '1',
    scannedBy: '2',
    timestamp: new Date('2024-05-07T10:00:00')
  },
  {
    id: '2',
    userId: '1',
    scannedBy: '3',
    timestamp: new Date('2024-05-06T15:30:00')
  }
]; 
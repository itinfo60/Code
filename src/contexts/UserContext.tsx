import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

interface Message {
  id: string;
  connectionId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

interface Connection {
  userId: string;
  userName: string;
  userEmail: string;
  connectedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  connections: Connection[];
}

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addConnection: (connection: Connection) => Promise<void>;
  sendMessage: (connectionId: string, content: string) => Promise<void>;
  messages: Message[];
  connections: Connection[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Set up axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user data
      axios.get(`${API_URL}/users/me`)
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Join user's socket room
      socket.emit('join', user.id);

      // Listen for new messages
      socket.on('newMessage', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      // Fetch connections
      axios.get(`${API_URL}/connections/user/${user.id}`)
        .then(response => {
          setConnections(response.data);
        });
    }

    return () => {
      socket.off('newMessage');
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/users/login`, { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        navigate('/signup');
      }
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setMessages([]);
    setConnections([]);
  };

  const addConnection = async (connection: Connection) => {
    if (!user) return;

    try {
      const response = await axios.post(`${API_URL}/connections`, {
        user1Id: user.id,
        user2Id: connection.userId
      });

      const newConnection = {
        ...connection,
        connectedAt: new Date().toISOString(),
      };

      setConnections(prev => [...prev, newConnection]);
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          connections: [...prev.connections, newConnection],
        };
      });
    } catch (error) {
      throw new Error('Failed to add connection');
    }
  };

  const sendMessage = async (connectionId: string, content: string) => {
    if (!user) return;

    try {
      const response = await axios.post(`${API_URL}/messages`, {
        connectionId,
        senderId: user.id,
        content
      });

      const newMessage = response.data;
      setMessages(prev => [...prev, newMessage]);

      // Emit message through socket
      socket.emit('sendMessage', {
        recipientId: connections.find(c => c.userId === connectionId)?.userId,
        message: newMessage
      });
    } catch (error) {
      throw new Error('Failed to send message');
    }
  };

  const reconnectSocket = () => {
    socket.disconnect();
    socket.connect();
  };

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        addConnection,
        sendMessage,
        messages,
        connections,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 
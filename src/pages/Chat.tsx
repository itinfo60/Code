import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Avatar,
  Flex,
} from '@chakra-ui/react';
import { mockUsers, mockChats, currentUser } from '../mockData';

const Chat = () => {
  const { id } = useParams<{ id: string }>();
  const [newMessage, setNewMessage] = useState('');
  const [keepChat, setKeepChat] = useState(false);

  const otherUser = mockUsers.find(user => user.id === id);
  const chat = mockChats.find(
    chat => (chat.user1Id === currentUser.id && chat.user2Id === id) ||
           (chat.user1Id === id && chat.user2Id === currentUser.id)
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    // In a real app, this would send the message to the backend
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const toggleKeepChat = () => {
    setKeepChat(!keepChat);
    // In a real app, this would update the chat status in the backend
    console.log('Toggling keep chat:', !keepChat);
  };

  if (!otherUser) {
    return <Box p={4}>User not found</Box>;
  }

  return (
    <Box h="100vh" display="flex" flexDirection="column">
      <Box p={4} bg="white" boxShadow="sm">
        <HStack spacing={4}>
          <Avatar
            size="sm"
            name={otherUser.name}
            src={otherUser.avatarUrl}
          />
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold">{otherUser.name}</Text>
            <Text fontSize="sm" color="gray.500">
              {otherUser.tag}
            </Text>
          </VStack>
          <Button
            onClick={toggleKeepChat}
            colorScheme={keepChat ? 'green' : 'gray'}
            variant="ghost"
            ml="auto"
            size="sm"
          >
            {keepChat ? 'Unlock' : 'Lock'}
          </Button>
        </HStack>
      </Box>

      <VStack
        flex={1}
        p={4}
        spacing={4}
        overflowY="auto"
        bg="gray.50"
      >
        {chat?.messages.map(message => (
          <Box
            key={message.id}
            alignSelf={message.senderId === currentUser.id ? 'flex-end' : 'flex-start'}
            bg={message.senderId === currentUser.id ? 'blue.500' : 'white'}
            color={message.senderId === currentUser.id ? 'white' : 'black'}
            p={3}
            borderRadius="lg"
            maxW="70%"
          >
            <Text>{message.content}</Text>
          </Box>
        ))}
      </VStack>

      <Box p={4} bg="white" borderTop="1px" borderColor="gray.200">
        <Flex>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            mr={2}
          />
          <Button
            colorScheme="blue"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            Send
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default Chat; 
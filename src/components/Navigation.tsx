import { Box, Button, HStack, useColorModeValue } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useUser();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      as="nav"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      p={4}
      zIndex={10}
    >
      <HStack spacing={4} justify="center" maxW="600px" mx="auto">
        <Button
          variant={location.pathname === '/scan' ? 'solid' : 'ghost'}
          colorScheme="blue"
          onClick={() => navigate('/scan')}
          flex={1}
        >
          Scan
        </Button>
        <Button
          variant={location.pathname === '/history' ? 'solid' : 'ghost'}
          colorScheme="blue"
          onClick={() => navigate('/history')}
          flex={1}
        >
          History
        </Button>
        <Button
          variant={location.pathname === '/profile' ? 'solid' : 'ghost'}
          colorScheme="blue"
          onClick={() => navigate('/profile')}
          flex={1}
        >
          Profile
        </Button>
        <Button
          variant="ghost"
          colorScheme="red"
          onClick={handleLogout}
          flex={1}
        >
          Logout
        </Button>
      </HStack>
    </Box>
  );
};

export default Navigation; 
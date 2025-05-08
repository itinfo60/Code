import { Box, VStack, Text, Button, Avatar, Heading } from '@chakra-ui/react';
import { QRCodeSVG } from 'qrcode.react';
import { currentUser } from '../mockData';

const Home = () => {
  return (
    <Box p={4} pt={8} maxW="600px" mx="auto" mb={20}>
      <VStack spacing={8}>
        <Avatar
          size="xl"
          name={currentUser.name}
          src={currentUser.avatarUrl}
        />
        <VStack spacing={2}>
          <Heading size="lg">{currentUser.name}</Heading>
          <Text color="gray.500">{currentUser.tag}</Text>
        </VStack>

        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          boxShadow="md"
          width="100%"
          maxW="300px"
        >
          <VStack spacing={4}>
            <Text fontWeight="bold">Your QR Code</Text>
            <QRCodeSVG
              value={currentUser.id}
              size={200}
              level="H"
              includeMargin
            />
          </VStack>
        </Box>

        <Button
          colorScheme="blue"
          size="lg"
          width="100%"
          maxW="300px"
          onClick={() => window.location.href = '/scan'}
        >
          Scan QR Code
        </Button>
      </VStack>
    </Box>
  );
};

export default Home; 
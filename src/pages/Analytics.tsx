import {
  Box,
  VStack,
  Text,
  Heading,
} from '@chakra-ui/react';
import { mockScanEvents } from '../mockData';

const Analytics = () => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const scansThisMonth = mockScanEvents.filter(event => {
    const eventDate = new Date(event.timestamp);
    return eventDate.getMonth() === currentMonth && 
           eventDate.getFullYear() === currentYear;
  });

  return (
    <Box p={4} pt={8} maxW="600px" mx="auto" mb={20}>
      <VStack spacing={8}>
        <Heading size="lg">Scan Analytics</Heading>

        <Box
          w="100%"
          p={6}
          bg="white"
          borderRadius="lg"
          boxShadow="sm"
        >
          <VStack spacing={2}>
            <Text fontSize="sm" color="gray.500">Total QR Scans</Text>
            <Text fontSize="4xl" fontWeight="bold">{scansThisMonth.length}</Text>
            <Text fontSize="sm" color="gray.500">This Month</Text>
          </VStack>
        </Box>

        {scansThisMonth.length === 0 && (
          <Text color="gray.500" textAlign="center">
            No scans recorded this month
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default Analytics; 
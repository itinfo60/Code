import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Container,
  Stack,
  Card,
  CardContent,
  TextField,
  IconButton,
  Avatar,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Theme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useSnackbar } from 'notistack';
import SendIcon from '@mui/icons-material/Send';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius * 2,
}));

interface MessageBubbleProps {
  isOwn: boolean;
}

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isOwn',
})<MessageBubbleProps>(({ theme, isOwn }) => ({
  padding: theme.spacing(1.5),
  maxWidth: '70%',
  backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.grey[100],
  color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
  borderRadius: theme.shape.borderRadius * 2,
  marginLeft: isOwn ? 'auto' : 0,
  marginRight: isOwn ? 0 : 'auto',
}));

const History = () => {
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user, connections, messages, sendMessage } = useUser();
  const { enqueueSnackbar } = useSnackbar();

  const handleSendMessage = () => {
    if (!selectedConnection || !message.trim()) return;

    sendMessage(selectedConnection, message);
    setMessage('');
    enqueueSnackbar('Message sent', { variant: 'success' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, pb: 10 }}>
      <Stack spacing={4}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <QrCodeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Connections
          </Typography>
        </Stack>

        {connections.length === 0 ? (
          <StyledCard>
            <CardContent>
              <Stack spacing={3} alignItems="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  No connections yet
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<QrCodeIcon />}
                  onClick={() => navigate('/scan')}
                >
                  Scan QR Code
                </Button>
              </Stack>
            </CardContent>
          </StyledCard>
        ) : (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            {/* Connections List */}
            <StyledCard sx={{ flex: { md: 1 } }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Connections
                </Typography>
                <List>
                  {connections.map((connection) => (
                    <ListItem key={connection.userId} disablePadding>
                      <ListItemButton
                        selected={selectedConnection === connection.userId}
                        onClick={() => setSelectedConnection(connection.userId)}
                      >
                        <ListItemAvatar>
                          <Avatar>{connection.userName[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={connection.userName}
                          secondary={connection.userEmail}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </StyledCard>

            {/* Chat Section */}
            <StyledCard sx={{ flex: { md: 2 } }}>
              <CardContent>
                {selectedConnection ? (
                  <Stack spacing={2} height="100%">
                    <Typography variant="h6">
                      Chat with {connections.find(c => c.userId === selectedConnection)?.userName}
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: 'auto',
                        maxHeight: '400px',
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                      }}
                    >
                      <Stack spacing={2}>
                        {messages
                          .filter((m) => m.connectionId === selectedConnection)
                          .map((msg, index) => (
                            <MessageBubble
                              key={index}
                              isOwn={msg.senderId === user.id}
                            >
                              <Typography variant="body1">{msg.content}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(msg.timestamp)}
                              </Typography>
                            </MessageBubble>
                          ))}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage();
                          }
                        }}
                      />
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                      >
                        <SendIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={3} alignItems="center" py={4}>
                    <Typography variant="h6" color="text.secondary">
                      Select a connection to start chatting
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </StyledCard>
          </Stack>
        )}
      </Stack>
    </Container>
  );
};

export default History; 
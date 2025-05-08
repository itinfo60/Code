import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Stack,
  Card,
  CardContent,
  Avatar,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useSnackbar } from 'notistack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius * 2,
}));

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const { enqueueSnackbar } = useSnackbar();

  if (!user) {
    return null;
  }

  const handleEdit = () => {
    setName(user.name);
    setEmail(user.email);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      enqueueSnackbar('Please fill in all fields', { variant: 'error' });
      return;
    }

    // Update user profile logic here
    enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4, pb: 10 }}>
      <Stack spacing={4}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {user.name[0]}
          </Avatar>
          <Typography variant="h4" component="h1">
            Profile
          </Typography>
        </Stack>

        <StyledCard>
          <CardContent>
            <Stack spacing={3}>
              {isEditing ? (
                <>
                  <TextField
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    required
                  />
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      fullWidth
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </Stack>
                </>
              ) : (
                <>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                      {user.name[0]}
                    </Avatar>
                    <Stack spacing={1}>
                      <Typography variant="h6">{user.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Stack>
                    <IconButton
                      color="primary"
                      onClick={handleEdit}
                      sx={{ ml: 'auto' }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Stack>
                </>
              )}

              <Button
                variant="outlined"
                color="error"
                onClick={handleLogout}
                fullWidth
              >
                Logout
              </Button>
            </Stack>
          </CardContent>
        </StyledCard>
      </Stack>
    </Container>
  );
};

export default Profile; 
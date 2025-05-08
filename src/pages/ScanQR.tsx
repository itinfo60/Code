import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  Card,
  CardContent,
  Container,
  IconButton,
  Paper,
  Fade,
  Zoom,
  useTheme,
  alpha,
} from '@mui/material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { QRCodeSVG } from 'qrcode.react';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ShareIcon from '@mui/icons-material/Share';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';

const StyledCard = styled(Card)(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const QrCodeContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'border-color 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

const ScannerContainer = styled(Box)(({ theme }) => ({
  width: 300,
  height: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  boxShadow: theme.shadows[2],
  position: 'relative',
  background: theme.palette.background.default,
  margin: '0 auto',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
    borderRadius: theme.shape.borderRadius * 2,
    pointerEvents: 'none',
  },
}));

const ScanQR = () => {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, addConnection } = useUser();
  const theme = useTheme();

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => {
          console.error('Error clearing scanner:', err);
        });
        scannerRef.current = null;
      }
    };
  }, []);

  const startScanning = () => {
    if (!user) return;

    setScanning(true);
    
    requestAnimationFrame(() => {
      const readerElement = document.getElementById('reader');
      if (!readerElement) {
        console.error('Reader element not found');
        enqueueSnackbar('Failed to initialize scanner', { variant: 'error' });
        setScanning(false);
        return;
      }

      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }

      const newScanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false
      );

      scannerRef.current = newScanner;
      setTimeout(() => {
        try {
          newScanner.render(onScanSuccess, onScanError);
        } catch (err) {
          console.error('Failed to render scanner:', err);
          enqueueSnackbar('Failed to start scanner', { variant: 'error' });
          setScanning(false);
        }
      }, 100);
    });
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((err) => {
        console.error('Error clearing scanner:', err);
      });
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = (decodedText: string) => {
    try {
      const connectionData = JSON.parse(decodedText);
      
      if (!connectionData.userId || !connectionData.name || !connectionData.email) {
        throw new Error('Invalid QR code data');
      }

      if (connectionData.userId === user?.id) {
        enqueueSnackbar('Cannot connect to yourself', { variant: 'error' });
        return;
      }

      addConnection({
        userId: connectionData.userId,
        userName: connectionData.name,
        userEmail: connectionData.email,
        connectedAt: new Date().toISOString(),
      });

      enqueueSnackbar(`Connected with ${connectionData.name}`, { variant: 'success' });
      stopScanning();
      navigate('/history');
    } catch (error) {
      enqueueSnackbar('Invalid QR code', { variant: 'error' });
    }
  };

  const onScanError = (error: string) => {
    console.error('QR Scan error:', error);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Connect with me on CanWeConnect',
        text: 'Scan my QR code to connect with me on CanWeConnect!',
        url: window.location.href,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Stack spacing={4} alignItems="center">
          <Typography variant="h4">Please Login First</Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Go to Login
          </Button>
        </Stack>
      </Container>
    );
  }

  const connectionString = JSON.stringify({
    userId: user.id,
    name: user.name,
    email: user.email,
  });

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Fade in timeout={1000}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <QrCodeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Can We Connect
            </Typography>
          </Stack>
        </Fade>

        {/* Your QR Code */}
        <Zoom in timeout={1000}>
          <StyledCard sx={{ display: scanning ? 'none' : 'block' }}>
            <CardContent>
              <Stack spacing={3} alignItems="center">
                <QrCodeContainer elevation={0}>
                  <QRCodeSVG
                    value={connectionString}
                    size={250}
                    level="H"
                    includeMargin={true}
                    bgColor={theme.palette.background.paper}
                    fgColor={theme.palette.primary.main}
                  />
                </QrCodeContainer>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Share this code with others to connect
                  </Typography>
                  <IconButton
                    color="primary"
                    onClick={handleShare}
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    <ShareIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </StyledCard>
        </Zoom>

        {/* Scanner */}
        <Fade in timeout={1000}>
          <StyledCard>
            <CardContent>
              <Stack spacing={3} alignItems="center">
                <Box 
                  sx={{ 
                    width: '100%', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: scanning ? 300 : 0, 
                    transition: 'height 0.3s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <ScannerContainer>
                    <div 
                      id="reader" 
                      style={{ 
                        width: 300, 
                        height: 300,
                        position: 'relative',
                      }} 
                    />
                  </ScannerContainer>
                </Box>

                {!scanning ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={startScanning}
                    startIcon={<CameraAltIcon />}
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                    }}
                  >
                    Start Scanner
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    onClick={stopScanning}
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                    }}
                  >
                    Stop Scanner
                  </Button>
                )}

                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ opacity: scanning ? 1 : 0.7 }}
                >
                  {scanning
                    ? 'Point your camera at a QR code to connect'
                    : 'Click Start Scanner to begin'}
                </Typography>
              </Stack>
            </CardContent>
          </StyledCard>
        </Fade>
      </Stack>
    </Container>
  );
};

export default ScanQR; 
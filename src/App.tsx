import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { UserProvider } from './contexts/UserContext';
import Login from './pages/Login';
import Profile from './pages/Profile';
import History from './pages/History';
import ScanQR from './pages/ScanQR';
import PrivateRoute from './components/PrivateRoute';
import BottomNav from './components/BottomNav';
import Signup from './pages/Signup';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  const location = useLocation();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <UserProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <History />
                </PrivateRoute>
              }
            />
            <Route
              path="/scan"
              element={
                <PrivateRoute>
                  <ScanQR />
                </PrivateRoute>
              }
            />
          </Routes>
          {/* Show BottomNav on all pages except login and signup */}
          {location.pathname !== '/' && location.pathname !== '/signup' && <BottomNav />}
        </UserProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;

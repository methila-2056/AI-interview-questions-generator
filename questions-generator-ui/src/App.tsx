import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, AppBar, Toolbar, Button, Box } from '@mui/material';
import JobDescriptionInput from './components/question';
import Login from './components/login';
import Register from './components/register';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    background: { default: '#f4f6f8' },
  },
});

const getAuthUser = () => {
  try {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState(getAuthUser());

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      setAuthUser(ce?.detail ?? getAuthUser());
    };
    window.addEventListener('authChanged', handler as EventListener);
    return () => window.removeEventListener('authChanged', handler as EventListener);
  }, []);

  const logout = () => {
    localStorage.removeItem('authUser');
    setAuthUser(null);
    window.dispatchEvent(new CustomEvent('authChanged', { detail: null }));
  };

  const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    if (!authUser) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 4 }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box>
              {authUser ? (
                <Button variant="outlined" onClick={logout}>
                  Logout
                </Button>
              ) : null}
            </Box>
          </Toolbar>
        </AppBar>

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Box sx={{ backgroundColor: '#f4f6f8', minHeight: '100vh', p: 4 }}>
                  <JobDescriptionInput />
                </Box>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff', // Cyan
    },
    secondary: {
      main: '#ff4081', // Pink
    },
    background: {
      default: '#0a1929', // Deep blue/black
      paper: '#132f4c',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
      background: 'linear-gradient(45deg, #00e5ff 30%, #ff4081 90%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
        fontWeight: 600,
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontSize: '1rem',
          padding: '10px 24px',
          boxShadow: '0 4px 14px 0 rgba(0, 229, 255, 0.39)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px 0 rgba(0, 229, 255, 0.5)',
          }
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: '16px',
                backgroundImage: 'none',
                backgroundColor: '#132f4c',
            }
        }
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                }
            }
        }
    }
  },
});

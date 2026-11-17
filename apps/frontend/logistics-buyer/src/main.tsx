import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'leaflet/dist/leaflet.css';
import { VersionBadge } from '@mockups/version-badge';
import './index.css';
import './styles/global.css';
import { loadConfig } from './api/config';
import App from './App';

// Angular Material M3 "azure" palette used by the original app.
const theme = createTheme({
  palette: {
    primary: { main: '#005cbb' },
    secondary: { main: '#565e71' },
    error: { main: '#ba1a1a' },
    background: { default: '#f5f7fa' },
  },
  typography: { fontFamily: 'Roboto, "Helvetica Neue", sans-serif' },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none' } } },
  },
});

// Static branch previews share one storage prefix and navigate with hash routes.
const Router = window.location.pathname.startsWith('/builds/') ? HashRouter : BrowserRouter;

loadConfig().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Router>
            <App />
          </Router>
          <VersionBadge corner="bottom-left" />
        </LocalizationProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
});

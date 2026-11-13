import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: { port: 5180, strictPort: true, host: true },
  preview: { port: 6180, strictPort: true, host: true },
  // Pre-bundle every library up front so Vite never re-optimizes mid-session (which loads a second React copy
  // until reload). Keep this list in sync when importing new MUI sub-paths.
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-dom/client', 'react-router',
      '@emotion/react', '@emotion/styled',
      '@mui/material', '@mui/material/styles', '@mui/material/Button', '@mui/material/Chip', '@mui/material/CircularProgress',
      '@mui/material/Dialog', '@mui/material/DialogContent', '@mui/material/IconButton', '@mui/material/InputAdornment',
      '@mui/material/List', '@mui/material/ListItem', '@mui/material/Popover', '@mui/material/Snackbar', '@mui/material/Stack',
      '@mui/material/TablePagination', '@mui/material/TextField', '@mui/material/Tooltip', '@mui/material/Menu',
      '@mui/material/MenuItem', '@mui/material/Tabs', '@mui/material/Tab', '@mui/material/Checkbox', '@mui/material/Select',
      '@mui/x-date-pickers/AdapterDayjs', '@mui/x-date-pickers/DateCalendar', '@mui/x-date-pickers/DatePicker',
      '@mui/x-date-pickers/LocalizationProvider',
      'dayjs', 'leaflet', 'react-leaflet', 'sweetalert2', 'xlsx',
    ],
  },
});

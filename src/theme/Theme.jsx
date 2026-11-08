import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#0F9E94", contrastText: "#FFFFFF" },
    secondary: { main: "#69E4DA", contrastText: "#0B2B29" },
    background: { default: "#EAFBF9", paper: "#FFFFFF" },
    text: { primary: "#12302E", secondary: "#4A6866" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
});

export default theme;
import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0F766E",
      dark: "#115E59",
      light: "#14B8A6",
    },
    secondary: {
      main: "#2563EB",
    },
    background: {
      default: "#F3F7F7",
      paper: "#FFFFFF",
    },
    success: {
      main: "#15803D",
    },
    warning: {
      main: "#D97706",
    },
    error: {
      main: "#DC2626",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
    },
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: [
      "IBM Plex Sans",
      "Inter",
      "Segoe UI",
      "Roboto",
      "Arial",
      "sans-serif",
    ].join(","),
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
          whiteSpace: "nowrap",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
        },
      },
    },
  },
});

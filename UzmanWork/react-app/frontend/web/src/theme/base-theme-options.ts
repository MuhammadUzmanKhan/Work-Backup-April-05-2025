import type { ThemeOptions } from "@mui/material";

// NOTE(@lberg): see https://mui.com/material-ui/customization/typography/

declare module "@mui/material/styles" {
  interface TypographyVariants {
    body3: React.CSSProperties;
    button1: React.CSSProperties;
    button2: React.CSSProperties;
    button3: React.CSSProperties;
    button4: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    body3?: React.CSSProperties;
    button1?: React.CSSProperties;
    button2?: React.CSSProperties;
    button3?: React.CSSProperties;
    button4?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    body3: true;
    button1: true;
    button2: true;
    button3: true;
    button4: true;
    h4: false;
    h5: false;
    h6: false;
    subtitle1: false;
    subtitle2: false;
    overline: false;
    caption: false;
  }
}

export const baseThemeOptions: ThemeOptions = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 1000,
      lg: 1200,
      xl: 1920,
    },
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#fff",
          color: "black",
          border: "1px solid lightgray",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      variants: [
        {
          props: { color: "secondary" },
          style: {
            backgroundColor: "#10B981",
            color: "#FFFFFF",
          },
        },
        {
          props: { color: "info" },
          style: {
            backgroundColor: "#FFFFFF",
            borderColor: "#C3C9D4",
            color: "#3C3E49",
            "&:hover": {
              borderColor: "#3C3E49",
              backgroundColor: "#FFFFFF",
            },
          },
        },
      ],
      styleOverrides: {
        root: () => ({
          fontSize: "0.75rem",
          textTransform: "none",
        }),
        sizeSmall: {
          padding: "6px 16px",
        },
        sizeMedium: {
          padding: "8px 20px",
        },
        sizeLarge: {
          padding: "11px 24px",
        },
        textSizeSmall: {
          padding: "7px 12px",
        },
        textSizeMedium: {
          padding: "9px 16px",
        },
        textSizeLarge: {
          padding: "12px 16px",
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          fontSize: "0.75rem",
          fontWeight: 500,
          textTransform: "none",
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "32px 24px",
          "&:last-child": {
            paddingBottom: "32px",
          },
        },
      },
    },
    MuiCardHeader: {
      defaultProps: {
        titleTypographyProps: {
          variant: "h2",
        },
        subheaderTypographyProps: {
          variant: "body2",
        },
      },
      styleOverrides: {
        root: {
          padding: "32px 24px",
        },
      },
    },
    MuiCheckbox: {
      defaultProps: {
        color: "primary",
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          boxSizing: "border-box",
        },
        html: {
          MozOsxFontSmoothing: "grayscale",
          WebkitFontSmoothing: "antialiased",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          width: "100%",
        },
        body: {
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "column",
          minHeight: "100%",
          width: "100%",
        },
        "#__next": {
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "column",
          height: "100%",
          width: "100%",
        },
        "#nprogress": {
          pointerEvents: "none",
        },
        "#nprogress .bar": {
          backgroundColor: "#5048E5",
          height: 3,
          left: 0,
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 2000,
        },
        ".hide_scroll_bar::-webkit-scrollbar": {
          display: "none",
        },
      },
    },
    MuiDrawer: {},
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: 8,
        },
        sizeSmall: {
          padding: 4,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          overflow: "hidden",
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: "hover",
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: "0.75rem",
          fontWeight: "500",
        },
        secondary: {
          fontSize: "0.75rem",
          fontWeight: "400",
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          marginRight: "16px",
          "&.MuiListItemIcon-root": {
            minWidth: "unset",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "4px",
        },
        input: {
          fontSize: "12px",
          fontWeight: 400,
          color: "#3C3E49",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          "& li[role='option']": {
            fontSize: "smaller",
          },
        },
      },
    },
    MuiPopover: {
      defaultProps: {
        elevation: 16,
      },
    },
    MuiRadio: {
      defaultProps: {
        color: "primary",
      },
    },
    MuiSwitch: {
      defaultProps: {
        color: "primary",
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: "1.25rem",
          fontWeight: 500,
          lineHeight: "1.5rem",
          minWidth: "auto",
          padding: "0.8rem",
          textTransform: "none",
          "& + &": {
            marginLeft: 24,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "15px 16px",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          borderBottom: "none",
          "& .MuiTableCell-root": {
            variant: "body2",
            borderBottom: "none",
            // fontSize: "12px",
            // fontWeight: 600,
            // lineHeight: 1,
            // letterSpacing: 0.5,
            textTransform: "capitalize",
          },
          "& .MuiTableCell-paddingCheckbox": {
            paddingTop: 4,
            paddingBottom: 4,
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          gap: "0.5rem",
        },
      },
    },
  },
  direction: "ltr",
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      '"Rubik", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    h1: {
      fontWeight: 600,
      fontSize: "1.875rem",
      lineHeight: "2.25rem",
    },
    h2: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: "1.4rem",
    },
    h3: {
      fontWeight: 600,
      fontSize: "0.875rem",
      lineHeight: "1.125rem",
    },
    body1: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: "1.125rem",
    },
    body2: {
      fontSize: "0.75rem",
      fontWeight: 400,
      lineHeight: "1rem",
    },
    body3: {
      display: "block",
      fontSize: "0.625rem",
      fontWeight: 400,
      lineHeight: "0.75rem",
    },
    button1: {
      fontSize: "0.875rem",
      fontWeight: 500,
      lineHeight: "1.125rem",
    },
    button2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: "1.125rem",
    },
    button3: {
      fontSize: "0.75rem",
      fontWeight: 500,
      lineHeight: "1rem",
    },
    button4: {
      fontSize: "0.75rem",
      fontWeight: 400,
      lineHeight: "1rem",
    },

    h4: undefined,
    h5: undefined,
    h6: undefined,
    subtitle1: undefined,
    subtitle2: undefined,
    overline: undefined,
    caption: undefined,
  },
};

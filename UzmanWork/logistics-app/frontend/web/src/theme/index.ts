import type { Direction, PaletteColor, Theme } from "@mui/material";
import { createTheme as createMuiTheme } from "@mui/material/styles";
import { baseThemeOptions } from "./base-theme-options";
import { darkThemeOptions } from "./dark-theme-options";
import { lightThemeOptions } from "./light-theme-options";

interface Neutral {
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  1000: string;
  A100: string;
  A200: string;
  A300: string;
  A400: string;
}

declare module "@mui/material/styles" {
  interface Palette {
    neutral?: Neutral;
    borderGrey: PaletteColor;
    inputsBackgroundHover: PaletteColor;
  }

  interface PaletteOptions {
    neutral?: Neutral;
  }
}

interface ThemeConfig {
  direction?: Direction;
  responsiveFontSizes?: boolean;
  mode: "light" | "dark";
}

export const createTheme = (config: ThemeConfig): Theme => {
  const theme = createMuiTheme(
    baseThemeOptions,
    config.mode === "dark" ? darkThemeOptions : lightThemeOptions,
    {
      direction: config.direction,
      palette: {
        borderGrey: {
          main: "#E5E5E5",
        },
        inputsBackgroundHover: {
          main: "rgba(230, 235, 242, 1)",
        },
      },
    }
  );
  // NOTE(@lberg): this breaks with custom variants
  // if (config.responsiveFontSizes) {
  //   theme = responsiveFontSizes(theme);
  // }

  return theme;
};

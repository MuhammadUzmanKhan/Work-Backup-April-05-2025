import {
  ThemeProvider,
  createTheme as createMuiTheme,
} from "@mui/material/styles";
import { ReactNode, createContext, useMemo, useState } from "react";
import { baseThemeOptions } from "../theme/base-theme-option";
import { darkThemeOptions } from "../theme/dark-theme-option";
import { lightThemeOptions } from "../theme/light-theme-option";

type ThemeContextType = {
  switchColorMode: () => void;
};

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeContext = createContext<ThemeContextType>({
  switchColorMode: () => {},
});

type ThemeMode = "light" | "dark";

export function ThemeContextProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  const switchColorMode = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () =>
      createMuiTheme(
        baseThemeOptions,
        mode === "dark" ? darkThemeOptions : lightThemeOptions
      ),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ switchColorMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}

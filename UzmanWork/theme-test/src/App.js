import { ThemeSwitcher, ThemeProvider } from "react-theme-switcher-phs";
function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <ThemeSwitcher />
      </div>
    </ThemeProvider>
  );
}

export default App;

import { ThemeProvider, ThemeSwitcher } from "react-theme-switcher";

const App = () => {
  return (
    <ThemeProvider>
      <div>
        <h1>My App</h1>
        <ThemeSwitcher />
      </div>
    </ThemeProvider>
  );
};

export default App;

//"./node_modules/react-theme-switcher/src/index"

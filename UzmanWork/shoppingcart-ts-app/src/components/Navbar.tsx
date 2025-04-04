import { Link } from "react-router-dom";
import { AppBar, Toolbar, Button, Box } from "@mui/material";

export function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Box pl={45} gap={8} justifyContent="center">
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          <Button color="inherit" component={Link} to="/store">
            Store
          </Button>
          <Button color="inherit" component={Link} to="/about">
            About
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

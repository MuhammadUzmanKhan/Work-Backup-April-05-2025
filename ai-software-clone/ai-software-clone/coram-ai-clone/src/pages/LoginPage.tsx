import {
  Button,
  Card,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { signInWithPopup } from "firebase/auth";
import { GoogleAuthProvider, signInWithEmailAndPassword } from "@firebase/auth";
import { useRecoilState } from "recoil";
import { authenticatedState, userState } from "../utils/globals";
import { auth } from "../firebaseconfig";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function LoginPage() {
  const [, setAuthenticated] = useRecoilState(authenticatedState);
  const [, setUser] = useRecoilState(userState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
      signInWithPopup(auth, provider).then((data) => {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setAuthenticated(true);
        navigate("/live");
      });
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  }
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      localStorage.setItem("user", JSON.stringify(userCredential.user));
      navigate("/live");
    } catch (error) {
      console.error("Error signing in with email and password:", error);
    }
  };

  return (
    <Container>
      <Grid
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={2}
        style={{ minHeight: "100vh" }}
      >
        <Grid item xs={12}>
          <Card style={{ padding: "2rem", textAlign: "center" }}>
            <Typography variant="h2" gutterBottom>
              Welcome Back!
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Sign in to continue.
            </Typography>
            <Stack gap={2} p={8}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleGoogleSignIn}
                sx={{ minWidth: "10rem" }}
              >
                Sign in with Google
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => null}
              >
                Sign in with Apple
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => null}
              >
                Sign in with Microsoft
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </Button>
              <form onSubmit={handleEmailLogin}>
                <Stack gap={2} p={8}>
                  <TextField
                    label="Email"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <TextField
                    label="Password"
                    variant="outlined"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    sx={{ minWidth: "10rem" }}
                  >
                    Sign in with Email
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

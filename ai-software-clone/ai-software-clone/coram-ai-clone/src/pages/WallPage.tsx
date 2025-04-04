// import { authenticatedState } from "../utils/globals";
// import { useRecoilValue } from "recoil";
// import { useNavigate } from "react-router-dom";

import { Button } from "@mui/material";

export function PersonalWall() {
  // const isAuthenticated = useRecoilValue(authenticatedState);
  // const navigate = useNavigate();

  // if (!isAuthenticated) {
  //   navigate("/*");
  //   return null;
  // }

  return <Button onClick={() => localStorage.clear()}>Logout</Button>;
}

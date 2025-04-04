import React, { createContext, useState } from "react";
import { USER_OBJECT } from "../services";


export interface IClickupUser {
  clickupId: string;
  clickupUsername: string;
  clickupEmail: string;
  clickupProfilePicture: string
}
interface InitialState {
  user: Object,
  setUser: React.Dispatch<any>,
  clickupUser: IClickupUser
  setClickupUser: React.Dispatch<IClickupUser>
}

const initialState: InitialState = {
  user: {},
  setUser: () => { },
  clickupUser: {clickupId: '', clickupUsername: '', clickupEmail: '', clickupProfilePicture: ''},
  setClickupUser: () => {}
}

export const AppContext = createContext(initialState);

const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem(USER_OBJECT) || "{}"));
  const [clickupUser, setClickupUser] = useState<IClickupUser>({clickupId: '', clickupUsername: '', clickupEmail: '', clickupProfilePicture: ''})

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        clickupUser,
        setClickupUser
      }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;

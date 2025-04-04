// UserContext.tsx
import React, { createContext, useReducer, useContext, ReactNode } from "react";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  photo: string;
  gender: "Male" | "Female";
  email: string;
  mobileNo: string;
  dob: string;
  city: string;
  skills: string[];
}

type Action =
  | { type: "ADD_USER"; payload: User }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "DELETE_USER"; payload: number }
  | { type: "SHOW_FORM"; payload: boolean }
  | { type: "RESET_FORM" }
  | { type: "SAVE_FORM" };

type Dispatch = (action: Action) => void;

type State = {
  users: User[];
  form: User; // Assuming you have a form property in your state
  savedForm: User | null; // Assuming you want to save the form data
  open: Boolean; // check if the form is open or not
};

const initialState: State = {
  users: [],
  form: {
    id: 0,
    firstName: "",
    lastName: "",
    photo: "",
    gender: "Male",
    email: "",
    mobileNo: "",
    dob: "",
    city: "",
    skills: [],
  },
  savedForm: null,
  open: false,
};

const UserContext = createContext<
  { state: State; dispatch: Dispatch } | undefined
>(undefined);

const userReducer = (state: State, action: Action): State => {
  console.log("action", action, state);
  switch (action.type) {
    case "ADD_USER":
      return { ...state, users: [...state.users, action.payload], open: false };
    case "UPDATE_USER":
      return {
        ...state,
        form: action.payload,
        open: false,
        users: state.users.map((user) =>
          user.id === action.payload.id ? action.payload : user
        ),
      };
    case "DELETE_USER":
      return {
        ...state,
        users: state.users.filter((user) => user.id !== action.payload),
      };
    case "RESET_FORM":
      return { ...state, form: initialState.form };
    case "SAVE_FORM":
      return { ...state, savedForm: state.form };
    case "SHOW_FORM":
      return { ...state, open: action.payload };
    default:
      return state;
  }
};

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider: React.FC<UserProviderProps> = ({
  children,
}: UserProviderProps) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};

const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

export { UserProvider, useUserContext };

import { useAuth0 } from "@auth0/auth0-react";
import { UserRole } from "coram-common-utils";
import { createContext } from "react";
import { Outlet } from "react-router-dom";

function userRoleFromString(value: string): UserRole {
  return (Object.values(UserRole) as unknown as string[]).includes(value)
    ? (value as unknown as UserRole)
    : UserRole.NONE;
}

function useRole(): UserRole {
  const { isAuthenticated, user } = useAuth0();
  if (!isAuthenticated || !user) return UserRole.NONE;
  return userRoleFromString(user["role_assignment"]);
}

export const RoleContext = createContext<UserRole>(UserRole.NONE);

export function RoleContextProvider() {
  const role = useRole();
  return (
    <RoleContext.Provider value={role}>
      <Outlet />
    </RoleContext.Provider>
  );
}

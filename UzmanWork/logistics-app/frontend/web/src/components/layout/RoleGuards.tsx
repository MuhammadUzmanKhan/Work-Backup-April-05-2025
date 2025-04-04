import { UserRole } from "coram-common-utils";
import { RoleContext } from "components/auth/RoleContextProvider";
import { ReactNode, useContext } from "react";

const USER_ROLE_MAP: Record<UserRole, number> = {
  [UserRole.NONE]: 1,
  [UserRole.LIVE_ONLY]: 2,
  [UserRole.LIMITED]: 3,
  [UserRole.REGULAR]: 4,
  [UserRole.ADMIN]: 5,
  [UserRole.SUPPORT]: 6,
};

function hasRights(targetRole: UserRole, minimumRole: UserRole): boolean {
  return USER_ROLE_MAP[targetRole] >= USER_ROLE_MAP[minimumRole];
}

export function useIsAdmin() {
  const role = useContext(RoleContext);
  return hasRights(role, UserRole.ADMIN);
}

export function AdminUserRequired({ children }: { children?: ReactNode }) {
  const isAdmin = useIsAdmin();
  return isAdmin ? <>{children}</> : <></>;
}

export function useIsRegularUser() {
  const role = useContext(RoleContext);
  return hasRights(role, UserRole.REGULAR);
}

export function RegularUserRequired({ children }: { children?: ReactNode }) {
  const isRegularUser = useIsRegularUser();
  return isRegularUser ? <>{children}</> : <></>;
}

export function useIsLimitedUser() {
  const role = useContext(RoleContext);
  return hasRights(role, UserRole.LIMITED);
}

export function LimitedUserRequired({ children }: { children?: ReactNode }) {
  const isLimited = useIsLimitedUser();
  return isLimited ? <>{children}</> : <></>;
}

export function useIsLiveOnlyUser() {
  const role = useContext(RoleContext);
  return hasRights(role, UserRole.LIVE_ONLY);
}

export function LiveOnlyUserRequired({ children }: { children?: ReactNode }) {
  const isLiveOnly = useIsLiveOnlyUser();
  return isLiveOnly ? <>{children}</> : <></>;
}

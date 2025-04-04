import { Link } from "react-router-dom";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { getInitials } from "../../services/utils/helpers";
import { ROLE } from "../../services/types/common";
import { routes } from "../../services";
import { UserState } from "../../services/types/user";

const Profile = ({
  user,
  logoutHandler,
  subscriptionActive,
}: {
  user: UserState;
  logoutHandler: () => void;
  subscriptionActive: boolean;
}) => {
  const userInitials = getInitials(user?.name);

  // Dropdown menu items
  const menu: MenuProps = {
    items: [
      {
        key: "user-info",
        label: (
          <div>
            <p>
              <strong>{user?.name}</strong>
            </p>
            <p style={{ fontSize: "0.75rem", color: "gray" }}>
              Role: {user.role === ROLE.OWNER ? "Owner" : user.role === ROLE.COMPANY_ADMIN ? "Admin" : "Business Developer"}
            </p>
            <p style={{ fontSize: "0.75rem", color: "gray" }}>Email: {user?.email}</p>
          </div>
        ),
        disabled: true,
      },
      { type: "divider" },
      {
        key: "settings",
        label: (
          <Link
            to={routes.settings}
            className={`${subscriptionActive !== false ? "" : "pointer-events-none cursor-not-allowed opacity-50"}`}
          >
            <span>
              Settings
            </span>
          </Link>
        ),
      },
      [ROLE.COMPANY_ADMIN, ROLE.OWNER].includes(user?.role) ? {
        key: "teams",
        label: (
          <Link to={routes.teamMembers}>
            <span >
              Team
            </span>
          </Link>
        ),
      } : null,
      [ROLE.OWNER].includes(user?.role) ? {
        key: "billing",
        label: (
          <Link to={routes.billing}>
            <span >
              Billing
            </span>
          </Link>
        ),
      } : null,
      { type: "divider" },
      {
        key: "logout",
        onClick: logoutHandler,
        label: (
          <span style={{ color: "red" }}>
            Log Out
          </span>
        ),
      },
    ],
  };

  return (
    <Dropdown
      menu={menu}
      trigger={["click"]}
      placement="bottomRight"
    >
      <p className="p-2 bg-orange-400 text-white cursor-pointer text-lg font-bold">
        {userInitials}
      </p>
    </Dropdown>
  );
};

export default Profile;

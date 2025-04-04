import { Link } from "react-router-dom";
import { Breadcrumbs, type SxProps, Typography } from "@mui/material";
import { NavigateNext as NavigateNextIcon } from "@mui/icons-material";

interface Breadcrumb {
  to: string;
  label: string;
}

export function StyledBreadcrumbs({
  breadcrumbs,
  sx,
}: {
  breadcrumbs: Breadcrumb[];
  sx?: SxProps;
}) {
  return (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={sx}>
      {breadcrumbs.map(({ to, label }, index) => (
        <Link key={index} to={to} style={{ textDecoration: "none" }}>
          <Typography
            variant="body2"
            fontWeight={index === breadcrumbs.length - 1 ? 600 : undefined}
            color="common.black"
          >
            {label}
          </Typography>
        </Link>
      ))}
    </Breadcrumbs>
  );
}

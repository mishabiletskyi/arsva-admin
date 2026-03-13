import { useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Button,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DomainRoundedIcon from "@mui/icons-material/DomainRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PhoneInTalkRoundedIcon from "@mui/icons-material/PhoneInTalkRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const drawerWidth = 240;

const navItems = [
  { label: "Dashboard", path: "/", icon: <DashboardRoundedIcon fontSize="small" /> },
  {
    label: "Organizations",
    path: "/organizations",
    icon: <DomainRoundedIcon fontSize="small" />,
    requiresPlatformOwner: true,
  },
  {
    label: "Properties",
    path: "/properties",
    icon: <ApartmentRoundedIcon fontSize="small" />,
  },
  { label: "Tenants", path: "/tenants", icon: <HomeWorkRoundedIcon fontSize="small" /> },
  { label: "Imports", path: "/imports", icon: <UploadFileRoundedIcon fontSize="small" /> },
  { label: "Call Logs", path: "/call-logs", icon: <CallRoundedIcon fontSize="small" /> },
  {
    label: "Call Policy",
    path: "/call-policy",
    icon: <SettingsSuggestRoundedIcon fontSize="small" />,
  },
  {
    label: "Outbound Calls",
    path: "/outbound-calls",
    icon: <PhoneInTalkRoundedIcon fontSize="small" />,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: <SummarizeRoundedIcon fontSize="small" />,
  },
  {
    label: "Admin Users",
    path: "/admin-users",
    icon: <GroupRoundedIcon fontSize="small" />,
    requiresPlatformOwner: true,
    advanced: true,
  },
];

function formatRoleLabel(role: string | null): string {
  if (!role) {
    return "No access";
  }

  if (role === "platform_owner") {
    return "Owner";
  }

  if (role === "viewer") {
    return "Viewer";
  }

  return "Manager";
}

export function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);
  const {
    user,
    logout,
    currentOrganization,
    currentRole,
    isPlatformOwner,
  } = useAuth();

  const visibleNavItems = useMemo(
    () =>
      navItems.filter(
        (item) =>
          (!item.requiresPlatformOwner || isPlatformOwner) &&
          (!item.advanced || showAdvancedMenu)
      ),
    [isPlatformOwner, showAdvancedMenu]
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        overflowX: "hidden",
        bgcolor: "background.default",
        background:
          "radial-gradient(circle at top left, rgba(20,184,166,0.12), transparent 35%), radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent 28%)",
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid rgba(15, 23, 42, 0.08)",
            background:
              "linear-gradient(180deg, rgba(15,118,110,0.97), rgba(15,23,42,0.98))",
            color: "#F8FAFC",
          },
        }}
      >
        <Toolbar sx={{ px: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            ARSVA Admin
          </Typography>
        </Toolbar>

        <Box sx={{ px: 1.5, py: 1 }}>
          <List>
            {visibleNavItems.map((item) => (
              <ListItemButton
                key={item.path}
                selected={pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.75,
                  color: "rgba(241,245,249,0.88)",
                  "&.Mui-selected": {
                    bgcolor: "rgba(255,255,255,0.14)",
                    color: "#FFFFFF",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "rgba(255,255,255,0.18)",
                  },
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <Box sx={{ mr: 1.5, display: "grid", placeItems: "center" }}>
                  {item.icon}
                </Box>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>

          {isPlatformOwner ? (
            <>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1.5 }} />

              <Button
                variant={showAdvancedMenu ? "contained" : "outlined"}
                size="small"
                onClick={() => setShowAdvancedMenu((currentValue) => !currentValue)}
                sx={{
                  width: "100%",
                  borderColor: "rgba(255,255,255,0.35)",
                  color: "#F8FAFC",
                  bgcolor: showAdvancedMenu ? "rgba(255,255,255,0.18)" : "transparent",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.5)",
                    bgcolor: "rgba(255,255,255,0.12)",
                  },
                }}
              >
                {showAdvancedMenu ? "Hide advanced menu" : "Show advanced menu"}
              </Button>
            </>
          ) : null}
        </Box>

      </Drawer>

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AppBar
          position="static"
          elevation={0}
          color="inherit"
          sx={{
            borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
            bgcolor: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(14px)",
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: { xs: "wrap", xl: "nowrap" },
              alignItems: { xs: "flex-start", xl: "center" },
              gap: 2,
              minHeight: { xs: "auto", md: 88 },
              py: { xs: 1.5, md: 0 },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                flex: "1 1 320px",
                minWidth: 0,
                lineHeight: 1.25,
                fontSize: { xs: "1.05rem", md: "1.25rem" },
              }}
            >
              Automated Rent Status Voice Assistant
            </Typography>

            <Stack
              direction={{ xs: "column", xl: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", xl: "center" }}
              sx={{ width: { xs: "100%", xl: "auto" } }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ width: { xs: "100%", xl: "auto" } }}
              >
                <Chip
                  label={`Organization: ${currentOrganization?.name ?? "Not assigned"}`}
                  variant="outlined"
                  sx={{
                    bgcolor: "rgba(15,118,110,0.06)",
                    borderColor: "rgba(15,118,110,0.3)",
                    maxWidth: { xs: "100%", sm: 320 },
                  }}
                />

                <Chip
                  label={formatRoleLabel(currentRole)}
                  variant="outlined"
                  sx={{
                    bgcolor: "rgba(37,99,235,0.06)",
                    borderColor: "rgba(37,99,235,0.3)",
                    maxWidth: { xs: "100%", sm: 200 },
                  }}
                />
              </Stack>

              <Box sx={{ alignSelf: { xs: "flex-end", xl: "auto" } }}>
                <IconButton
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                  sx={{
                    p: 0.75,
                    borderRadius: 2,
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
                    {(user?.full_name || user?.email || "A").charAt(0).toUpperCase()}
                  </Avatar>
                  <KeyboardArrowDownRoundedIcon />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2">
                      {user?.full_name || "Admin User"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {formatRoleLabel(currentRole)}
                    </Typography>
                  </Box>
                  <MenuItem
                    onClick={() => {
                      setMenuAnchor(null);
                      logout();
                      navigate("/login");
                    }}
                  >
                    Sign out
                  </MenuItem>
                </Menu>
              </Box>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

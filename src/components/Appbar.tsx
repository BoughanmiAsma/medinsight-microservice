import * as React from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import MenuIcon from "@mui/icons-material/Menu";
import Avatar from "@mui/material/Avatar";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { mainListItems, secondaryListItems } from "./listItems";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { Link } from "react-router-dom";
import { settings } from "../constant";
import { AppBar, Drawer } from "../styles";

interface AppbarProps {
  appBarTitle: string;
  notificationsCount?: number;
}

export default function Appbar({
  appBarTitle,
  notificationsCount = 0,
}: AppbarProps) {
  const [open, setOpen] = React.useState(true);
  const [anchorElUser, setAnchorElUser] =
    React.useState<null | HTMLElement>(null);

  const toggleDrawer = () => setOpen((prev) => !prev);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElUser(event.currentTarget);

  const handleCloseUserMenu = () => setAnchorElUser(null);

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="absolute" open={open}>
        <Toolbar sx={{ pr: "24px" }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: "36px",
              ...(open && { display: "none" }),
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            {appBarTitle}
          </Typography>

          <Box sx={{ display: { xs: "none", md: "flex" } }}>
            <IconButton size="large" aria-label="notifications" color="inherit">
              <Badge badgeContent={notificationsCount} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Tooltip title="Profil / Settings">
              <IconButton
                size="large"
                edge="end"
                aria-label="account menu"
                aria-haspopup="true"
                color="inherit"
                onClick={handleOpenUserMenu}
              >
                <Avatar alt="User Avatar" src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip>

            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              keepMounted
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting, index) => (
                <MenuItem
                  key={index}
                  component={Link}
                  to={setting.url}
                  onClick={handleCloseUserMenu}
                  sx={{ textDecoration: "none", color: "inherit" }}
                >
                  <Typography textAlign="center">
                    {setting.text}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open}>
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: [1],
            minHeight: "64px !important",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, gap: 1 }}>
            <img src="/hospital.svg" height="40px" alt="logo" />

            <Typography
              variant="h4"
              sx={{
                color: "#005B93",
                fontWeight: 600,
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
                whiteSpace: "nowrap",
                overflow: "visible",
              }}
            >
              MEDINSIGHT
            </Typography>
          </Box>

          <IconButton onClick={toggleDrawer} sx={{ flexShrink: 0 }}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>

        <Divider />

        <List component="nav">
          {mainListItems}
          <Divider sx={{ my: 1 }} />
          {secondaryListItems}
        </List>
      </Drawer>
    </Box>
  );
}

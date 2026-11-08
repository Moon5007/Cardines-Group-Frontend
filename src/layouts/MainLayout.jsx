
import { useEffect } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

import Header from "../components/Header";

export default function MainLayout() {

  // Cursor and touch-following effect
  useEffect(() => {
    const handlePointerMove = (event) => {
      document.documentElement.style.setProperty(
        "--cursor-x",
        `${event.clientX}px`
      );

      document.documentElement.style.setProperty(
        "--cursor-y",
        `${event.clientY}px`
      );
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "transparent",
        position: "relative",
      }}
    >
      <Header />
      <Outlet />
    </Box>
  );
}


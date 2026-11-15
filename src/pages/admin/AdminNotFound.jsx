import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function AdminNotFound() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" sx={{ fontWeight: 800, color: "#0b5d57" }}>
        Page not found
      </Typography>
      <Typography sx={{ mt: 1, mb: 3 }}>
        This admin page does not exist.
      </Typography>
      <Button
        component={RouterLink}
        to="/dashboard"
        variant="contained"
        sx={{
          fontWeight: 700,
          borderRadius: 2,
          bgcolor: "#0b5d57",
          "&:hover": { bgcolor: "#08463f" },
        }}
      >
        Back to dashboard
      </Button>
    </Box>
  );
}
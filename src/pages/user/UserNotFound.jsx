import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function UserNotFound() {
  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Typography variant="h3" sx={{ fontWeight: 800, color: "#0b5d57" }}>
        Page not found
      </Typography>
      <Typography sx={{ mt: 1, mb: 3 }}>
        Sorry, we couldn't find the page you were looking for.
      </Typography>
      <Button
        component={RouterLink}
        to="/"
        variant="contained"
        sx={{
          fontWeight: 700,
          borderRadius: 2,
          bgcolor: "#0b5d57",
          "&:hover": { bgcolor: "#08463f" },
        }}
      >
        Back to home
      </Button>
    </Box>
  );
}
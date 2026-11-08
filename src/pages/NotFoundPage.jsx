
import {
  Button,
  Stack,
  Typography,
} from "@mui/material";

import {
  Link as RouterLink,
} from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="page-container">

      <Stack
        spacing={2}
        alignItems="flex-start"
      >

        {/* Page Title */}
        <Typography
          variant="h4"
          component="h1"
        >
          Page not found
        </Typography>

        {/* Error Message */}
        <Typography color="text.secondary">
          The page you requested does not exist.
        </Typography>

        {/* Return Button */}
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
        >
          Go to product catalog
        </Button>

      </Stack>

    </main>
  );
}

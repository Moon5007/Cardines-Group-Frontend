import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import api from "../../api/axios";

const TEAL_DARK = "#0b5d57";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    contact_number: "",
    birthday: "",
    gender: "",
    address: "",
    password: "",
    password_confirmation: "",
    admin_secret: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({});
  setMessage("");

  if (form.password !== form.password_confirmation) {
    setErrors({ password_confirmation: ["Passwords do not match."] });
    return;
  }

  setLoading(true);
  try {
    const payload = { ...form };
    ["admin_secret", "contact_number", "birthday", "gender", "address"].forEach(
      (key) => {
        if (!payload[key]) delete payload[key];
      }
    );

    await api.post("/register", payload);

    navigate("/login", {
      replace: true,
      state: { registered: true, email: form.email },
    });
  } catch (err) {
    if (err.response?.status === 422) {
      setErrors(err.response.data.errors || {});
    } else {
      setMessage(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  } finally {
    setLoading(false);
  }
};

  const fieldError = (name) => errors[name]?.[0] || "";
  const today = new Date().toISOString().split("T")[0];

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(105,228,218,0.35))",
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.75), rgba(105,228,218,0.3))",
          backdropFilter: "blur(16px) saturate(160%)",
          WebkitBackdropFilter: "blur(16px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 8px 32px rgba(11,93,87,0.15)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: TEAL_DARK }}>
            Create your account
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Join GoCart and start shopping
          </Typography>
        </Box>

        {message && <Alert severity="error">{message}</Alert>}

        <TextField
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          fullWidth
          autoComplete="name"
          error={Boolean(fieldError("name"))}
          helperText={fieldError("name")}
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          fullWidth
          autoComplete="email"
          error={Boolean(fieldError("email"))}
          helperText={fieldError("email")}
        />

        <TextField
          label="Contact number"
          name="contact_number"
          value={form.contact_number}
          onChange={handleChange}
          fullWidth
          autoComplete="tel"
          error={Boolean(fieldError("contact_number"))}
          helperText={fieldError("contact_number")}
        />

        <TextField
          label="Birthday"
          name="birthday"
          type="date"
          value={form.birthday}
          onChange={handleChange}
          fullWidth
          autoComplete="bday"
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: today }}
          error={Boolean(fieldError("birthday"))}
          helperText={fieldError("birthday")}
          sx={{
         "& input": { textAlign: "center" },
         "& input::-webkit-datetime-edit": { display: "flex", justifyContent: "center" },
  }}
        />

        <TextField
          select
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          fullWidth
          error={Boolean(fieldError("gender"))}
          helperText={fieldError("gender")}
        >
          <MenuItem value="male">Male</MenuItem>
          <MenuItem value="female">Female</MenuItem>
          <MenuItem value="other">Other / Prefer not to say</MenuItem>
        </TextField>

        <TextField
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          fullWidth
          multiline
          minRows={2}
          autoComplete="street-address"
          error={Boolean(fieldError("address"))}
          helperText={fieldError("address")}
        />

        <TextField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={handleChange}
          required
          fullWidth
          autoComplete="new-password"
          error={Boolean(fieldError("password"))}
          helperText={fieldError("password")}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((s) => !s)}
                  edge="end"
                  aria-label="toggle password visibility"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Confirm password"
          name="password_confirmation"
          type={showPassword ? "text" : "password"}
          value={form.password_confirmation}
          onChange={handleChange}
          required
          fullWidth
          autoComplete="new-password"
          error={Boolean(fieldError("password_confirmation"))}
          helperText={fieldError("password_confirmation")}
        />

      
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: TEAL_DARK,
            "&:hover": { bgcolor: "#08463f" },
          }}
        >
          {loading ? "Creating account..." : "Register"}
        </Button>

        <Typography variant="body2" sx={{ textAlign: "center" }}>
          Already have an account?{" "}
          <Link
            component={RouterLink}
            to="/login"
            sx={{ fontWeight: 700, color: TEAL_DARK }}
          >
            Login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
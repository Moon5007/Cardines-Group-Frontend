import { Chip } from "@mui/material";
import { STATUS_COLORS, normalizeStatus } from "../constants/productStatus";

export default function StatusChip({ status, size = "small" }) {
  const label = normalizeStatus(status);
  const color = STATUS_COLORS[label];

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        fontWeight: 700,
        color,
        backgroundColor: `${color}1f`, // light tint of the same color
        border: `1px solid ${color}`,
      }}
    />
  );
}
export const STATUS_OPTIONS = ["Available", "Low Stock", "Out of Stock"];

export const STATUS_COLORS = {
  "Available": "#2e7d32",    // green
  "Low Stock": "#ed6c02",    // orange
  "Out of Stock": "#d32f2f", // red
};

// Old rows in your database say "active"/"inactive", so map them to the new names
export function normalizeStatus(value) {
  if (STATUS_OPTIONS.includes(value)) return value;
  if (value === "active") return "Available";
  if (value === "inactive") return "Out of Stock";
  return "Available";
}
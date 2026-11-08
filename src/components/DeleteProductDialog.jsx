
import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

export default function DeleteProductDialog({
  product,
  onClose,
  onConfirm,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // DELETE request happens only here, never on Cancel
  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      // The parent (ProductListPage) closes the dialog after a successful delete.
      await onConfirm();
    } catch (err) {
      // Request failed: the product stays in the list and the dialog stays open
      setError("Unable to delete product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={Boolean(product)}
      onClose={submitting ? undefined : handleClose}
    >
      <DialogTitle>
        Delete product?
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DialogContentText>
          Are you sure you want to delete "{product?.name}"?
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>

        <Button
          color="error"
          variant="contained"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
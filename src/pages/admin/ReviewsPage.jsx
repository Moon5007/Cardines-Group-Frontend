import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Paper,
  Rating,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../api/axios";

const TEAL_DARK = "#0b5d57";
const TEAL_LIGHT = "rgba(105,228,218,0.35)";
const RED = "#d32f2f";

// Works with either [ ... ] or { data: [ ... ] } (Laravel paginate)
const toList = (response) => {
  const data = response.data;
  return Array.isArray(data) ? data : data?.data ?? [];
};

const getCategory = (review) => {
  const c = review.product?.category;
  return typeof c === "string" ? c : c?.name ?? "";
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

const glassSx = {
  borderRadius: 3,
  border: "1px solid rgba(11,93,87,0.15)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(105,228,218,0.25))",
  backdropFilter: "blur(16px) saturate(160%)",
  WebkitBackdropFilter: "blur(16px) saturate(160%)",
};

const tealBtnSx = {
  bgcolor: TEAL_DARK,
  fontWeight: 700,
  "&:hover": { bgcolor: "#08463f" },
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [selected, setSelected] = useState(null);
  const [focusResponse, setFocusResponse] = useState(false);
  const [response, setResponse] = useState("");
  const [posting, setPosting] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/reviews");
      setReviews(toList(res));
    } catch (err) {
      console.error("Reviews failed:", err);
      setError("Couldn't load reviews. Check that the API is running, then try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => [...new Set(reviews.map(getCategory).filter(Boolean))],
    [reviews]
  );

  const visibleReviews = useMemo(
    () =>
      reviews.filter((r) => {
        const matchesRating =
          ratingFilter === "all" || Number(r.rating) === Number(ratingFilter);
        const matchesCategory =
          categoryFilter === "all" || getCategory(r) === categoryFilter;
        return matchesRating && matchesCategory;
      }),
    [reviews, ratingFilter, categoryFilter]
  );

  const openReview = (review, focus = false) => {
    setSelected(review);
    setResponse(review.admin_response ?? "");
    setFocusResponse(focus);
  };

  const postResponse = async () => {
    if (!selected || !response.trim()) return;
    setPosting(true);
    try {
      await api.post(`/reviews/${selected.id}/respond`, { response });
      const updated = { ...selected, admin_response: response };
      setSelected(updated);
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setToast("Response posted");
    } catch (err) {
      console.error("Respond failed:", err);
      setToast(err.response?.data?.message || "Couldn't post the response.");
    } finally {
      setPosting(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/reviews/${toDelete.id}`);
      setReviews((prev) => prev.filter((r) => r.id !== toDelete.id));
      if (selected?.id === toDelete.id) setSelected(null);
      setToast("Review removed");
      setToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setToast(err.response?.data?.message || "Couldn't remove the review.");
    } finally {
      setDeleting(false);
    }
  };

  const productLine = (review) =>
    [review.product?.name, getCategory(review), review.product?.color ?? review.product?.variant]
      .filter(Boolean)
      .join(" — ") || "Unknown product";

  return (
    <Box
      sx={{
        minHeight: "100%",
        py: { xs: 3, md: 5 },
        background: `linear-gradient(180deg, ${TEAL_LIGHT} 0%, rgba(255,255,255,0) 280px)`,
      }}
    >
      <Container maxWidth="lg">
        {selected ? (
          /* ---------- Detail view ---------- */
          <Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelected(null)}
              sx={{
                mb: 2,
                fontWeight: 700,
                borderRadius: 2,
                borderColor: TEAL_DARK,
                color: TEAL_DARK,
                bgcolor: "background.paper",
              }}
            >
              Exit
            </Button>

            <Paper elevation={0} sx={{ ...glassSx, p: { xs: 2, md: 3 }, mb: 3 }}>
              <Stack direction="row" gap={2} alignItems="flex-start">
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: TEAL_DARK,
                    fontWeight: 700,
                  }}
                >
                  {getInitials(selected.user?.name)}
                </Avatar>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    gap={1.5}
                  >
                    <Box
                      sx={{
                        flexGrow: 1,
                        p: 1.5,
                        bgcolor: "background.paper",
                        border: "1px solid rgba(11,93,87,0.25)",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Product Description:
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>
                        {productLine(selected)}
                      </Typography>
                    </Box>

                    <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} gap={0.75}>
                      <Stack direction="row" alignItems="center" gap={0.75}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          Ratings: {(Number(selected.rating) || 0).toFixed(1)}/5
                        </Typography>
                        <Rating
                          value={Number(selected.rating) || 0}
                          readOnly
                          size="small"
                        />
                      </Stack>
                      <Chip
                        label={selected.status ?? "Active"}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          color: "#fff",
                          bgcolor: "#43a047",
                          textTransform: "capitalize",
                        }}
                      />
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor: "background.paper",
                      border: "1px solid rgba(11,93,87,0.25)",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Comment:
                    </Typography>
                    <Typography>{selected.comment || "No comment"}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ ...glassSx, p: { xs: 2, md: 3 } }}>
              <Typography sx={{ fontWeight: 800, color: TEAL_DARK, mb: 1 }}>
                Respond
              </Typography>

              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                autoFocus={focusResponse}
                sx={{ bgcolor: "background.paper", borderRadius: 1 }}
              />

              <Stack direction="row" gap={1.5} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={postResponse}
                  disabled={posting || !response.trim()}
                  sx={tealBtnSx}
                >
                  {posting ? "Posting..." : "Post Response"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setToDelete(selected)}
                  sx={{
                    fontWeight: 700,
                    borderColor: RED,
                    color: RED,
                    "&:hover": { borderColor: RED, bgcolor: "rgba(211,47,47,0.08)" },
                  }}
                >
                  Remove Review
                </Button>
              </Stack>
            </Paper>
          </Box>
        ) : (
          /* ---------- List view ---------- */
          <Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              gap={2}
              sx={{ mb: 3 }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: TEAL_DARK }}>
                  Reviews
                </Typography>
                <Typography color="text.secondary">
                  See what customers say about your products.
                </Typography>
              </Box>

              <Button
                onClick={load}
                disabled={loading}
                startIcon={<RefreshIcon />}
                sx={{ color: TEAL_DARK, fontWeight: 700 }}
              >
                Refresh
              </Button>
            </Stack>

            <Stack direction="row" gap={1} sx={{ mb: 2 }}>
              <TextField
                select
                size="small"
                label="Filter"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                sx={{ minWidth: 140, bgcolor: "background.paper", borderRadius: 1 }}
              >
                <MenuItem value="all">All ratings</MenuItem>
                {[5, 4, 3, 2, 1].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n} {n === 1 ? "star" : "stars"}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ minWidth: 160, bgcolor: "background.paper", borderRadius: 1 }}
              >
                <MenuItem value="all">All categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {error && (
              <Alert
                severity="error"
                action={<Button onClick={load}>Try again</Button>}
                sx={{ mb: 3 }}
              >
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress sx={{ color: TEAL_DARK }} />
              </Box>
            ) : !error && visibleReviews.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  No reviews found
                </Typography>
                <Typography color="text.secondary">
                  {reviews.length === 0
                    ? "Reviews will show up here once customers leave them."
                    : "Try a different filter or category."}
                </Typography>
              </Box>
            ) : (
              !error && (
                <TableContainer component={Paper} elevation={0} sx={glassSx}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["Product", "Reviewer", "Rating", ""].map((label) => (
                          <TableCell
                            key={label || "actions"}
                            sx={{ fontWeight: 800, color: TEAL_DARK }}
                          >
                            {label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {visibleReviews.map((review) => (
                        <TableRow key={review.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {review.product?.name ?? "-"}
                          </TableCell>
                          <TableCell>{review.user?.name ?? "Unknown"}</TableCell>
                          <TableCell sx={{ color: RED, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {Number(review.rating) || 0} out of 5
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            <Stack direction="row" gap={0.75} justifyContent="flex-end">
                              <Button
                                size="small"
                                onClick={() => openReview(review)}
                                sx={{
                                  fontWeight: 700,
                                  color: RED,
                                  bgcolor: "rgba(211,47,47,0.1)",
                                  "&:hover": { bgcolor: "rgba(211,47,47,0.2)" },
                                }}
                              >
                                See comment
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => openReview(review, true)}
                                sx={{
                                  fontWeight: 700,
                                  borderColor: TEAL_DARK,
                                  color: TEAL_DARK,
                                  bgcolor: "background.paper",
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => setToDelete(review)}
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: "#f44336",
                                  "&:hover": { bgcolor: RED },
                                }}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            )}
          </Box>
        )}
      </Container>

      {/* Delete confirmation */}
      <Dialog open={Boolean(toDelete)} onClose={() => !deleting && setToDelete(null)}>
        <DialogTitle sx={{ fontWeight: 800, color: TEAL_DARK }}>
          Remove this review?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toDelete
              ? `The review by ${toDelete.user?.name ?? "this customer"} will be permanently removed.`
              : ""}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setToDelete(null)}
            disabled={deleting}
            sx={{ color: TEAL_DARK, fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmDelete}
            disabled={deleting}
            sx={tealBtnSx}
          >
            {deleting ? "Removing..." : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2500}
        onClose={() => setToast("")}
        message={toast}
      />
    </Box>
  );
}
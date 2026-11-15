import { useEffect, useMemo, useState } from "react";
import {
  Alert, Avatar, Box, Chip, CircularProgress, Table, TableBody, TableCell,
  TableHead, TableRow, Typography,
} from "@mui/material";
import api from "../../api/axios";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { lineClasses } from "@mui/x-charts/LineChart";
import { chartsAxisHighlightClasses } from "@mui/x-charts/ChartsAxisHighlight";

const LOW_STOCK_LIMIT = 5;
const WINDOW_DAYS = 30;
const DAY = 86400000;
const SLICE_COLORS = ["#2fd4c5", "#69e4da", "#8ceee5", "#4cc9bd", "#a9f3ec", "#1fb5a8"];
const TEAL_DARK = "#0b5d57";
const TEAL_LIGHT = "rgba(105,228,218,0.35)";

const peso = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const peso0 = (n) => "₱" + Math.round(Number(n || 0)).toLocaleString("en-PH");

const fmtCount = (n) => Number(n || 0).toLocaleString();

const card = {
  bgcolor: "rgba(255,255,255,0.88)",
  borderRadius: 1.5,
  boxShadow: "0 4px 16px rgba(0, 80, 75, 0.10)",
};

/* ---------- API helpers ---------- */
const toList = (res) => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.data?.data)) return d.data.data;
  return [];
};

const totalOf = (res) => {
  const d = res.data;
  if (d?.meta?.total != null) return d.meta.total;
  if (d?.total != null) return d.total;
  return toList(res).length;
};

/* ---------- Trend + change helpers ---------- */
const byDate = (a, b) =>
  a.created_at && b.created_at
    ? new Date(a.created_at) - new Date(b.created_at)
    : Number(a.id) - Number(b.id);

/* Running total in the order items were created, for the sparkline */
const cumulative = (items, valueOf) => {
  let sum = 0;
  return [...items].sort(byDate).map((it) => (sum += valueOf(it)));
};

const fmtDate = (t) =>
  new Date(t).toLocaleDateString("en-PH", { month: "short", day: "2-digit" });

const dateLabel = (item) =>
  item.created_at
    ? new Date(item.created_at).toLocaleDateString("en-PH", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "No date";

/* Labels in the same order as cumulative() so each point has a name */
const labelsFor = (items, labelOf) => [...items].sort(byDate).map(labelOf);

/* % growth over the last WINDOW_DAYS. Needs created_at; otherwise returns null. */
const growth = (items, valueOf) => {
  if (!items.some((i) => i.created_at)) return null;
  const cutoff = Date.now() - WINDOW_DAYS * DAY;
  const now = items.reduce((s, i) => s + valueOf(i), 0);
  const before = items
    .filter((i) => i.created_at && new Date(i.created_at).getTime() < cutoff)
    .reduce((s, i) => s + valueOf(i), 0);
  if (before <= 0) return null;
  return ((now - before) / before) * 100;
};

const fmtChange = (c) =>
  `${c > 0 ? "+" : c < 0 ? "-" : ""} ${Math.abs(Number(c.toFixed(1)))}%`;

/* ---------- Charts ---------- */
const smoothPath = (pts) =>
  pts.reduce((d, [x, y], i, a) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = a[i - 1];
    const cx = (px + x) / 2;
    return `${d} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, "");

function Sparkline({ data, color, width = 110, height = 40 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [
    4 + (i / (data.length - 1)) * (width - 8),
    height - 6 - ((v - min) / (max - min || 1)) * (height - 12),
  ]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function InteractiveSparkline({ data, labels, color, index, onIndexChange }) {
  if (!data || data.length < 2) return null;

  return (
    <SparkLineChart
      data={data}
      height={44}
      width={130}
      area
      showHighlight
      baseline="min"
      color={color}
      margin={{ bottom: 0, top: 5, left: 4, right: 0 }}
      xAxis={{ id: "point-axis", data: labels }}
      yAxis={{
        domainLimit: (_, maxValue) => ({
          min: -maxValue / 6, // leaves a few pixels below the lowest point
          max: maxValue,
        }),
      }}
      onHighlightedAxisChange={(axisItems) =>
        onIndexChange(axisItems[0]?.dataIndex ?? null)
      }
      highlightedAxis={
        index === null ? [] : [{ axisId: "point-axis", dataIndex: index }]
      }
      axisHighlight={{ x: "line" }}
      clipAreaOffset={{ top: 2, bottom: 2 }}
      slotProps={{ lineHighlight: { r: 4 } }}
      sx={{
        [`& .${lineClasses.area}`]: { opacity: 0.2 },
        [`& .${lineClasses.line}`]: { strokeWidth: 3 },
        [`& .${chartsAxisHighlightClasses.root}`]: {
          stroke: color,
          strokeDasharray: "none",
          strokeWidth: 2,
        },
      }}
    />
  );
}

function KpiCard({ label, value, change, color, data, labels, format }) {
  const [index, setIndex] = useState(null);

  const interactive = Boolean(labels && data && data.length > 1);
  const hovering = interactive && index !== null && data[index] != null;
  const shownValue = hovering && format ? format(data[index]) : value;

  return (
    <Box sx={{ ...card, px: 2, py: 1.5, position: "relative" }}>
      <Typography sx={{ fontWeight: 800, color: "#8e8aa8", fontSize: 18, lineHeight: 1.1 }}>
        {label}
      </Typography>

      <Typography sx={{ fontSize: 11, color: "#8e8aa8", minHeight: 16 }}>
        {hovering ? labels[index] : ""}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#2b2b3a" }}>
          {shownValue}
        </Typography>

        {interactive ? (
          <InteractiveSparkline
            data={data}
            labels={labels}
            color={color}
            index={index}
            onIndexChange={setIndex}
          />
        ) : (
          <Sparkline data={data} color={color} />
        )}
      </Box>

      {change != null && (
        <Typography sx={{ position: "absolute", top: 8, right: 12, fontSize: 12, fontWeight: 700, color }}>
          {fmtChange(change)}
        </Typography>
      )}
    </Box>
  );
}

function LineChart({ points }) {
  const W = 600, H = 280, L = 50, R = 16, T = 16, B = 32;
  const max = Math.max(5, Math.ceil(Math.max(...points.map((p) => p.value), 0) / 5) * 5);
  const x = (i) => L + (i / (points.length - 1 || 1)) * (W - L - R);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * max));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Stock by product">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e6e6ee" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#777">{t}</text>
        </g>
      ))}
      {points.map((_, i) => (
        <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#777">{i + 1}</text>
      ))}
      <polyline
        points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
        fill="none" stroke="#7b2d8e" strokeWidth="1.8"
      />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill="#fff" stroke="#7b2d8e">
          <title>{`${p.label}: ${p.value} in stock`}</title>
        </circle>
      ))}
    </svg>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <Typography sx={{ p: 2 }}>No products yet.</Typography>;
  const cx = 110, cy = 110, R = 95, r = 26;
  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const a0 = angle;
    angle += (d.value / total) * Math.PI * 2;
    const a1 = Math.min(angle, a0 + Math.PI * 2 - 0.0001);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
    const [x0, y0] = p(R, a0), [x1, y1] = p(R, a1), [x2, y2] = p(r, a1), [x3, y3] = p(r, a0);
    return {
      ...d,
      color: SLICE_COLORS[i % SLICE_COLORS.length],
      path: `M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${large} 0 ${x3},${y3} Z`,
    };
  });
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, flexWrap: "wrap" }}>
      <svg viewBox="0 0 220 220" width="220" height="220" role="img" aria-label="Products by category">
        {slices.map((s) => (
          <path key={s.name} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1.5" />
        ))}
      </svg>
      <Box>
        {slices.map((s) => (
          <Box key={s.name} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: s.color }} />
            <Typography variant="body2">{s.name} ({Math.round((s.value / total) * 100)}%)</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ---------- Categories + trending boxes ---------- */
const boxTitle = { mb: 0.5, fontSize: 14, color: "#1c3b38" };

function CategoriesBox({ categories }) {
  return (
    <Box>
      <Typography sx={boxTitle}>Categories</Typography>
      <Box sx={{ ...card, p: 2, maxHeight: 340, overflowY: "auto" }}>
        {categories === null ? (
          <Typography color="text.secondary">Categories unavailable.</Typography>
        ) : categories.length === 0 ? (
          <Typography color="text.secondary">No categories yet.</Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            }}
          >
            {categories.map((c) => {
              const inactive = c.status === "inactive";
              return (
                <Box
                  key={c.id}
                  sx={{
                    border: "1px solid rgba(11,93,87,0.15)",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "#fff",
                    opacity: inactive ? 0.6 : 1,
                  }}
                >
                  {c.image_url ? (
                    <Box
                      component="img"
                      src={c.image_url}
                      alt={c.name}
                      sx={{ width: "100%", height: 80, objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 80,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: TEAL_LIGHT,
                        color: TEAL_DARK,
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      No image
                    </Box>
                  )}
                  <Box sx={{ p: 0.75, textAlign: "center" }}>
                    <Typography noWrap sx={{ fontSize: 12, fontWeight: 700 }}>
                      {c.name}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>
                      {c.products_count ?? 0} products{inactive ? " · inactive" : ""}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function TrendingBox({ trending }) {
  return (
    <Box>
      <Typography sx={boxTitle}>Trending products (most purchased)</Typography>
      <Box sx={{ ...card, p: 2, maxHeight: 340, overflowY: "auto" }}>
        {trending === null ? (
          <Typography color="text.secondary">Trending products unavailable.</Typography>
        ) : trending.length === 0 ? (
          <Typography color="text.secondary">No purchases yet.</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {trending.map((p, index) => (
              <Box key={p.id} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography sx={{ width: 24, fontWeight: 800, color: TEAL_DARK }}>
                  {index + 1}
                </Typography>
                <Avatar
                  variant="rounded"
                  src={p.image_url ?? undefined}
                  alt={p.name}
                  sx={{ bgcolor: TEAL_LIGHT, color: TEAL_DARK }}
                >
                  {p.name?.[0]}
                </Avatar>
                <Typography noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
                  {p.name}
                </Typography>
                <Chip
                  size="small"
                  label={`${p.total_sold ?? 0} sold`}
                  sx={{ bgcolor: TEAL_DARK, color: "#fff", fontWeight: 700 }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

const statusColor = (stock) => (stock <= 0 ? "#d63b3b" : stock <= LOW_STOCK_LIMIT ? "#ef8a17" : "#2e9e4f");
const statusLabel = (stock) => (stock <= 0 ? "Out of Stock" : stock <= LOW_STOCK_LIMIT ? "Low Stock" : "Available");

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState(null);   // null = endpoint unavailable
  const [users, setUsers] = useState(null);
  const [categories, setCategories] = useState(null);
  const [trending, setTrending] = useState(null);
  const [orderTotal, setOrderTotal] = useState(null);
  const [userTotal, setUserTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [prod, ord, usr, cat, trend] = await Promise.allSettled([
          api.get("/products"),
          api.get("/orders"),
          api.get("/users"),
          api.get("/categories"),
          api.get("/admin/trending-products"),
        ]);
        if (cancelled) return;
        if (prod.status === "rejected") throw prod.reason;
        setProducts(toList(prod.value));
        if (ord.status === "fulfilled") { setOrders(toList(ord.value)); setOrderTotal(totalOf(ord.value)); }
        if (usr.status === "fulfilled") { setUsers(toList(usr.value)); setUserTotal(totalOf(usr.value)); }
        if (cat.status === "fulfilled") setCategories(toList(cat.value));
        if (trend.status === "fulfilled") setTrending(toList(trend.value));
      } catch {
        if (!cancelled) setError("Unable to load dashboard data. Check the API connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const stock = (p) => Number(p.stock) || 0;
    const price = (p) => Number(p.price) || 0;
    const orderAmount = (o) => Number(o.total_amount ?? o.total ?? o.amount) || 0;

    const stockUnits = products.reduce((s, p) => s + stock(p), 0);
    const inventoryValue = products.reduce((s, p) => s + price(p) * stock(p), 0);

    // Revenue comes from orders when they carry an amount; otherwise show inventory value
    const orderRevenue = orders ? orders.reduce((s, o) => s + orderAmount(o), 0) : 0;
    const useOrders = orders && orderRevenue > 0;

    const kpis = [
      useOrders
        ? {
            label: "Revenue",
            value: peso0(orderRevenue),
            color: "#ff9800",
            change: growth(orders, orderAmount),
            data: cumulative(orders, orderAmount),
            labels: labelsFor(orders, (o) =>
              o.created_at ? fmtDate(o.created_at) : `Order #${o.id}`
            ),
            format: peso0,
          }
        : {
            label: "Inventory",
            value: peso0(inventoryValue),
            color: "#ff9800",
            change: growth(products, (p) => price(p) * stock(p)),
            data: cumulative(products, (p) => price(p) * stock(p)),
            labels: labelsFor(products, (p) => p.name),
            format: peso0,
          },
      {
        label: "Orders",
        color: "#f44336",
        value: orders ? orderTotal.toLocaleString() : "—",
        change: orders ? growth(orders, () => 1) : null,
        data: orders ? cumulative(orders, () => 1) : null,
        labels: orders
          ? labelsFor(orders, (o) =>
              o.created_at ? fmtDate(o.created_at) : `Order #${o.id}`
            )
          : null,
        format: fmtCount,
      },
      {
        label: "Users",
        color: "#2e9e4f",
        value: users ? userTotal.toLocaleString() : "—",
        change: users ? growth(users, () => 1) : null,
        data: users ? cumulative(users, () => 1) : null,
        labels: users
          ? labelsFor(users, (u) =>
              u.created_at
                ? `${u.name ?? "User"} · ${fmtDate(u.created_at)}`
                : u.name ?? `User #${u.id}`
            )
          : null,
        format: fmtCount,
      },
      {
        label: "Stocks",
        color: "#ff9800",
        value: stockUnits.toLocaleString(),
        change: growth(products, stock),
        data: cumulative(products, stock),
        labels: labelsFor(products, (p) => p.name),
        format: fmtCount,
      },
    ];

    const byCategory = {};
    products.forEach((p) => {
      const c = p.category || "Uncategorized";
      byCategory[c] = (byCategory[c] || 0) + 1;
    });
    const categoryCounts = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const stockPoints = [...products].sort(byDate).map((p) => ({ label: p.name, value: stock(p) }));
    const recent = [...products].sort(byDate).reverse().slice(0, 5);

    return { kpis, categories: categoryCounts, stockPoints, recent };
  }, [products, orders, users, orderTotal, userTotal]);

  if (loading) {
    return <Box sx={{ display: "grid", placeItems: "center", py: 10 }}><CircularProgress /></Box>;
  }
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  const fmtDay = (t) => new Date(t).toLocaleDateString("en-PH", { month: "short", day: "2-digit" });
  const range = `${fmtDay(Date.now() - WINDOW_DAYS * DAY)} - ${fmtDay(Date.now())}`;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
        <Chip size="small" label={range} sx={{ bgcolor: "rgba(255,255,255,0.85)", fontSize: 11 }} />
      </Box>

      {/* KPI cards */}
      <Box
        sx={{
          display: "grid", gap: 2.5, mb: 4,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
        }}
      >
        {stats.kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </Box>

      {/* Box 1: categories with images | Box 2: trending products */}
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mb: 4 }}>
        <CategoriesBox categories={categories} />
        <TrendingBox trending={trending} />
      </Box>

      {/* Charts */}
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mb: 4 }}>
        <Box>
          <Typography sx={{ mb: 0.5, fontSize: 14, color: "#1c3b38" }}>Chart: Stock by product</Typography>
          <Box sx={{ ...card, p: 2 }}>
            {stats.stockPoints.length ? <LineChart points={stats.stockPoints} /> : <Typography>No products yet.</Typography>}
          </Box>
        </Box>
        <Box>
          <Typography sx={{ mb: 0.5, fontSize: 14, color: "#1c3b38" }}>Chart: Products by category</Typography>
          <Box sx={{ ...card, p: 2 }}><DonutChart data={stats.categories} /></Box>
        </Box>
      </Box>

      {/* Recent products */}
      <Box sx={{ ...card, overflow: "hidden" }}>
        <Typography sx={{ textAlign: "center", fontWeight: 700, py: 1.5, borderBottom: "1px solid #e6e6ee" }}>
          Recent Products
        </Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["SKU", "Name", "Category", "Price", "Stock", "Status"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.recent.map((p) => {
                const stock = Number(p.stock) || 0;
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.sku || "—"}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.category || "—"}</TableCell>
                    <TableCell>{peso(p.price)}</TableCell>
                    <TableCell>{stock}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={statusLabel(stock)}
                        sx={{ bgcolor: statusColor(stock), color: "#fff", fontWeight: 700 }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { extractApiErrorMessage } from "../api/errorMessage";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  searchAuditLogs,
  getAuditLogDetail,
  type AuditLogListItem,
  type AuditLogDetail,
} from "../api/adminAuditLogs";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminAuditLogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<AuditLogListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [entityIdFilter, setEntityIdFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");

  // Detail dialog
  const [selectedDetail, setSelectedDetail] = useState<AuditLogDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const roleLabel = (role: string) => {
    if (role === "ADMIN") return t("adminAuditLog.roles.admin");
    if (role === "CLIENT") return t("adminAuditLog.roles.client");
    if (role === "NURSE") return t("adminAuditLog.roles.nurse");
    return role;
  };

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchAuditLogs({
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
        entityId: entityIdFilter || undefined,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
        pageNumber,
        pageSize,
      });
      setItems(response.items);
      setTotalCount(response.totalCount);
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, t("adminAuditLog.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [pageNumber, pageSize]);

  const handleSearch = () => {
    setPageNumber(1);
    void load();
  };

  const handleClearFilters = () => {
    setActionFilter("");
    setEntityTypeFilter("");
    setEntityIdFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setPageNumber(1);
  };

  const handleViewDetail = async (id: string) => {
    try {
      const detail = await getAuditLogDetail(id);
      setSelectedDetail(detail);
      setDetailDialogOpen(true);
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, t("adminAuditLog.errors.detailFailed")));
    }
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedDetail(null);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPageNumber(newPage + 1);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPageNumber(1);
  };

  return (
    <AdminPortalShell
      eyebrow={t("adminAuditLog.eyebrow")}
      title={t("adminAuditLog.title")}
      description={t("adminAuditLog.description")}
      actions={(
        <>
          <Button variant="outlined" onClick={() => navigate("/admin")}>
            {t("adminAuditLog.actions.back")}
          </Button>
          <Button variant="contained" onClick={() => void load()} disabled={isLoading}>
            {t("adminAuditLog.actions.refresh")}
          </Button>
        </>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>{t("adminAuditLog.filters.title")}</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
            <TextField
              label={t("adminAuditLog.filters.action")}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              size="small"
              placeholder={t("adminAuditLog.filters.placeholders.action")}
            />
            <TextField
              label={t("adminAuditLog.filters.entityType")}
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              size="small"
              placeholder={t("adminAuditLog.filters.placeholders.entityType")}
            />
            <TextField
              label={t("adminAuditLog.filters.entityId")}
              value={entityIdFilter}
              onChange={(e) => setEntityIdFilter(e.target.value)}
              size="small"
              placeholder={t("adminAuditLog.filters.placeholders.entityId")}
            />
            <TextField
              label={t("adminAuditLog.filters.fromDate")}
              type="date"
              value={fromDateFilter}
              onChange={(e) => setFromDateFilter(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t("adminAuditLog.filters.toDate")}
              type="date"
              value={toDateFilter}
              onChange={(e) => setToDateFilter(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleSearch} disabled={isLoading}>
              {t("adminAuditLog.filters.search")}
            </Button>
            <Button variant="outlined" onClick={handleClearFilters}>
              {t("adminAuditLog.filters.clear")}
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell>{t("adminAuditLog.table.timestamp")}</TableCell>
                  <TableCell>{t("adminAuditLog.table.actor")}</TableCell>
                  <TableCell>{t("adminAuditLog.table.role")}</TableCell>
                  <TableCell>{t("adminAuditLog.table.action")}</TableCell>
                  <TableCell>{t("adminAuditLog.table.entityType")}</TableCell>
                  <TableCell>{t("adminAuditLog.table.entityId")}</TableCell>
                  <TableCell>{t("adminAuditLog.table.notes")}</TableCell>
                  <TableCell align="right">{t("adminAuditLog.table.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      {t("adminAuditLog.table.loading")}
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      {t("adminAuditLog.table.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{formatTimestamp(item.createdAtUtc)}</TableCell>
                      <TableCell>{item.actorName || t("adminAuditLog.detail.system")}</TableCell>
                      <TableCell>
                        <Chip label={roleLabel(item.actorRole)} size="small" />
                      </TableCell>
                      <TableCell>{item.action}</TableCell>
                      <TableCell>{item.entityType}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                        {item.entityId.length > 20 ? `${item.entityId.substring(0, 20)}...` : item.entityId}
                      </TableCell>
                      <TableCell>{item.notes || "-"}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => void handleViewDetail(item.id)}>
                          {t("adminAuditLog.table.viewDetail")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={pageNumber - 1}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage={t("adminAuditLog.table.pagination.rowsPerPage")}
            labelDisplayedRows={({ from, to, count }) =>
              t("adminAuditLog.table.pagination.displayedRows", { from, to, count })
            }
          />
        </Paper>
      </Stack>

      <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>{t("adminAuditLog.detail.title")}</DialogTitle>
        <DialogContent>
          {selectedDetail && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("adminAuditLog.detail.id")}</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{selectedDetail.id}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("adminAuditLog.detail.timestamp")}</Typography>
                <Typography variant="body2">{formatTimestamp(selectedDetail.createdAtUtc)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("adminAuditLog.detail.actor")}</Typography>
                <Typography variant="body2">{selectedDetail.actorName || t("adminAuditLog.detail.system")}</Typography>
                {selectedDetail.actorEmail && (
                  <Typography variant="body2" color="text.secondary">{selectedDetail.actorEmail}</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("adminAuditLog.detail.actorRole")}</Typography>
                <Typography variant="body2">{roleLabel(selectedDetail.actorRole)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("adminAuditLog.detail.action")}</Typography>
                <Typography variant="body2">{selectedDetail.action}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("adminAuditLog.detail.entityType")}</Typography>
                <Typography variant="body2">{selectedDetail.entityType}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{t("adminAuditLog.detail.entityId")}</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                  {selectedDetail.entityId}
                </Typography>
              </Box>
              {selectedDetail.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t("adminAuditLog.detail.notes")}</Typography>
                  <Typography variant="body2">{selectedDetail.notes}</Typography>
                </Box>
              )}
              {selectedDetail.metadataJson && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t("adminAuditLog.detail.metadata")}</Typography>
                  <Paper sx={{ p: 2, bgcolor: "grey.50", mt: 1 }}>
                    <pre style={{ margin: 0, fontSize: "0.85rem", overflow: "auto" }}>
                      {JSON.stringify(JSON.parse(selectedDetail.metadataJson), null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>{t("adminAuditLog.detail.close")}</Button>
        </DialogActions>
      </Dialog>
    </AdminPortalShell>
  );
}

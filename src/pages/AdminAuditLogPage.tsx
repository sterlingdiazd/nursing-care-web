import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    timeStyle: "short" 
  }).format(new Date(value));
}

function roleLabel(role: string) {
  if (role === "Admin") return "Administrador";
  if (role === "Client") return "Cliente";
  if (role === "Nurse") return "Enfermera";
  return role;
}

export default function AdminAuditLogPage() {
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
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar los registros de auditoria.");
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
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar el detalle.");
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
      eyebrow="Registro de auditoria"
      title="Historial completo de acciones administrativas sensibles"
      description="Busca, filtra e inspecciona eventos de auditoria para cumplimiento, seguridad y propositos operativos."
      actions={(
        <>
          <Button variant="outlined" onClick={() => navigate("/admin")}>Volver al panel</Button>
          <Button variant="contained" onClick={() => void load()} disabled={isLoading}>Actualizar</Button>
        </>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Paper sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Filtros de busqueda</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
            <TextField
              label="Accion"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              size="small"
              placeholder="Ej: AdminAccountCreated"
            />
            <TextField
              label="Tipo de entidad"
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              size="small"
              placeholder="Ej: User"
            />
            <TextField
              label="ID de entidad"
              value={entityIdFilter}
              onChange={(e) => setEntityIdFilter(e.target.value)}
              size="small"
              placeholder="Ej: guid"
            />
            <TextField
              label="Desde fecha"
              type="date"
              value={fromDateFilter}
              onChange={(e) => setFromDateFilter(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hasta fecha"
              type="date"
              value={toDateFilter}
              onChange={(e) => setToDateFilter(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleSearch} disabled={isLoading}>
              Buscar
            </Button>
            <Button variant="outlined" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell>Fecha y hora</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Accion</TableCell>
                  <TableCell>Tipo de entidad</TableCell>
                  <TableCell>ID de entidad</TableCell>
                  <TableCell>Notas</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      Cargando registros de auditoria...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      No se encontraron registros de auditoria.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{formatTimestamp(item.createdAtUtc)}</TableCell>
                      <TableCell>{item.actorName || "Sistema"}</TableCell>
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
                          Ver detalle
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
            labelRowsPerPage="Filas por pagina:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      </Stack>

      <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de auditoria</DialogTitle>
        <DialogContent>
          {selectedDetail && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{selectedDetail.id}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha y hora</Typography>
                <Typography variant="body2">{formatTimestamp(selectedDetail.createdAtUtc)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Actor</Typography>
                <Typography variant="body2">{selectedDetail.actorName || "Sistema"}</Typography>
                {selectedDetail.actorEmail && (
                  <Typography variant="body2" color="text.secondary">{selectedDetail.actorEmail}</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Rol del actor</Typography>
                <Typography variant="body2">{roleLabel(selectedDetail.actorRole)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Accion</Typography>
                <Typography variant="body2">{selectedDetail.action}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Tipo de entidad</Typography>
                <Typography variant="body2">{selectedDetail.entityType}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">ID de entidad</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                  {selectedDetail.entityId}
                </Typography>
              </Box>
              {selectedDetail.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Notas</Typography>
                  <Typography variant="body2">{selectedDetail.notes}</Typography>
                </Box>
              )}
              {selectedDetail.metadataJson && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Metadata (JSON)</Typography>
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
          <Button onClick={handleCloseDetail}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </AdminPortalShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { createCareRequest, getCareRequests } from "../api/careRequests";
import WorkspaceShell from "../components/layout/WorkspaceShell";
import { useAuth } from "../context/AuthContext";
import {
  clearClientLogs,
  createCorrelationId,
  logClientEvent,
  useClientLogs,
} from "../logging/clientLogger";

const SERVICE_TYPES: Record<
  string,
  { category: "hogar" | "domicilio" | "medicos"; basePrice: number; unitType: string }
> = {
  hogar_diario: { category: "hogar", basePrice: 2500, unitType: "dia_completo" },
  hogar_basico: { category: "hogar", basePrice: 55000, unitType: "mes" },
  hogar_estandar: { category: "hogar", basePrice: 60000, unitType: "mes" },
  hogar_premium: { category: "hogar", basePrice: 65000, unitType: "mes" },
  domicilio_dia_12h: { category: "domicilio", basePrice: 2500, unitType: "medio_dia" },
  domicilio_noche_12h: { category: "domicilio", basePrice: 2500, unitType: "medio_dia" },
  domicilio_24h: { category: "domicilio", basePrice: 3500, unitType: "dia_completo" },
  suero: { category: "medicos", basePrice: 2000, unitType: "sesion" },
  medicamentos: { category: "medicos", basePrice: 2000, unitType: "sesion" },
  sonda_vesical: { category: "medicos", basePrice: 2000, unitType: "sesion" },
  sonda_nasogastrica: { category: "medicos", basePrice: 3000, unitType: "sesion" },
  sonda_peg: { category: "medicos", basePrice: 4000, unitType: "sesion" },
  curas: { category: "medicos", basePrice: 2000, unitType: "sesion" },
};

const CATEGORY_FACTOR: Record<"hogar" | "domicilio" | "medicos", number> = {
  hogar: 1.0,
  domicilio: 1.2,
  medicos: 1.5,
};

const DISTANCE_FACTORS: Record<string, number> = {
  local: 1.0,
  cercana: 1.1,
  media: 1.2,
  lejana: 1.3,
};

const COMPLEXITY_FACTORS: Record<string, number> = {
  estandar: 1.0,
  moderada: 1.1,
  alta: 1.2,
  critica: 1.3,
};

function volumeDiscountPercent(existingCount: number): number {
  if (existingCount >= 50) return 20;
  if (existingCount >= 20) return 15;
  if (existingCount >= 10) return 10;
  if (existingCount >= 5) return 5;
  if (existingCount >= 1) return 0;
  return 0;
}

export default function CareRequestPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [careRequestDescription, setCareRequestDescription] = useState("");
  const [careRequestType, setCareRequestType] = useState<string>("domicilio_24h");
  const [unit, setUnit] = useState<number>(1);
  const [distanceFactor, setDistanceFactor] = useState<string>("local");
  const [complexityLevel, setComplexityLevel] = useState<string>("estandar");
  const [clientBasePriceOverride, setClientBasePriceOverride] = useState<number | "">("");
  const [medicalSuppliesCost, setMedicalSuppliesCost] = useState<number | "">("");
  const [existingSameUnitTypeCount, setExistingSameUnitTypeCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const logs = useClientLogs();

  const trimmedDescription = careRequestDescription.trim();
  const descriptionCount = trimmedDescription.length;
  const latestLogs = useMemo(() => logs.slice(0, 4), [logs]);

  const selectedService = SERVICE_TYPES[careRequestType];
  const selectedCategory = selectedService?.category ?? "domicilio";
  const derivedUnitType = selectedService?.unitType ?? "dia_completo";
  const basePrice =
    typeof clientBasePriceOverride === "number" && clientBasePriceOverride > 0
      ? clientBasePriceOverride
      : selectedService?.basePrice ?? 0;

  const categoryFactor = CATEGORY_FACTOR[selectedCategory];
  const distanceFactorValue =
    selectedCategory === "domicilio" ? DISTANCE_FACTORS[distanceFactor] ?? 1.0 : 1.0;
  const complexityFactor =
    selectedCategory === "hogar" || selectedCategory === "domicilio"
      ? COMPLEXITY_FACTORS[complexityLevel] ?? 1.0
      : 1.0;

  const volumeDiscount = volumeDiscountPercent(existingSameUnitTypeCount);
  const unitPrice =
    basePrice * categoryFactor * distanceFactorValue * complexityFactor * (1 - volumeDiscount / 100);
  const medicalSupplies =
    selectedCategory === "medicos" && typeof medicalSuppliesCost === "number" && medicalSuppliesCost >= 0
      ? medicalSuppliesCost
      : 0;
  const estimatedTotal = unitPrice * unit + medicalSupplies;

  const canSubmit =
    !isLoading && Boolean(userId) && trimmedDescription.length > 0 && unit > 0 && Boolean(selectedService);

  useEffect(() => {
    if (!userId) {
      setExistingSameUnitTypeCount(0);
      return;
    }

    const currentUnitType = derivedUnitType;
    void getCareRequests()
      .then((list) => {
        const count = list.filter(
          (request) => request.userID === userId && (request.unitType ?? "") === currentUnitType,
        ).length;
        setExistingSameUnitTypeCount(count);
      })
      .catch(() => setExistingSameUnitTypeCount(0));
  }, [derivedUnitType, userId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!userId) {
      setFeedback({
        type: "error",
        message: "No se pudo identificar al usuario autenticado. Vuelve a iniciar sesion.",
      });
      return;
    }

    if (!trimmedDescription) {
      setFeedback({
        type: "error",
        message: "La descripcion de la solicitud es obligatoria.",
      });
      return;
    }

    const correlationId = createCorrelationId();

    setIsLoading(true);
    setFeedback(null);

    logClientEvent("web.ui", "Formulario de solicitud enviado", {
      correlationId,
      userId,
      careRequestType,
      descriptionLength: trimmedDescription.length,
    });

    try {
      const response = await createCareRequest(
        {
          careRequestDescription: trimmedDescription,
          careRequestType,
          unit,
          ...(typeof clientBasePriceOverride === "number" && clientBasePriceOverride > 0
            ? { clientBasePriceOverride }
            : {}),
          ...(selectedCategory === "domicilio" ? { distanceFactor } : {}),
          ...(selectedCategory === "hogar" || selectedCategory === "domicilio"
            ? { complexityLevel }
            : {}),
          ...(selectedCategory === "medicos" && typeof medicalSuppliesCost === "number"
            ? { medicalSuppliesCost }
            : {}),
        },
        correlationId,
      );

      logClientEvent("web.ui", "Solicitud creada correctamente", {
        correlationId,
        userId,
        createdId: response.id,
      });

      setFeedback({
        type: "success",
        message: `Solicitud creada correctamente con el ID ${response.id}.`,
      });
      setCareRequestDescription("");
      navigate(`/care-requests/${response.id}`);
    } catch (error: any) {
      logClientEvent(
        "web.ui",
        "La creacion de la solicitud mostro un error en la interfaz",
        {
          correlationId,
          userId,
          message: error.message ?? "Error desconocido",
        },
        "error",
      );

      setFeedback({
        type: "error",
        message: error.message ?? "Error desconocido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WorkspaceShell
      eyebrow="Nueva solicitud"
      title="Registra la solicitud con el contexto necesario para revisarla bien."
      description="Esta vista concentra validaciones, orientacion operativa y diagnosticos recientes del cliente mientras completas la solicitud."
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate("/care-requests")}>
            Ver cola
          </Button>
          <Button variant="contained" onClick={() => navigate("/home")}>
            Volver al resumen
          </Button>
        </>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.15fr 0.85fr" },
          gap: 3,
        }}
      >
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h4">Formulario de solicitud</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
                  La solicitud se vinculara automaticamente con el usuario autenticado actual.
                  Describe el cuidado requerido con el detalle suficiente para triage y aprobacion.
                </Typography>
              </Box>

              {feedback && <Alert severity={feedback.type}>{feedback.message}</Alert>}

              {!userId && (
                <Alert severity="warning">
                  La sesion actual no tiene un `userId` disponible. Cierra sesion e inicia sesion
                  de nuevo antes de crear solicitudes.
                </Alert>
              )}

              <TextField
                fullWidth
                label="Descripcion de la solicitud"
                multiline
                rows={8}
                value={careRequestDescription}
                onChange={(event) => setCareRequestDescription(event.target.value)}
                placeholder="Describe el cuidado requerido, urgencia, detalles clinicos relevantes y cualquier indicacion operativa para la aprobacion."
                disabled={isLoading}
                helperText={`${descriptionCount} caracteres`}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 1 }}>
                Servicio y estimacion
              </Typography>

              <TextField
                select
                fullWidth
                label="Tipo de solicitud"
                value={careRequestType}
                onChange={(event) => setCareRequestType(event.target.value)}
                disabled={isLoading}
                SelectProps={{ native: true }}
              >
                {Object.keys(SERVICE_TYPES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Categoria del servicio"
                value={selectedCategory}
                disabled
                helperText={`Tipo de unidad: ${derivedUnitType}`}
              />

              <TextField fullWidth label="Precio base" value={selectedService?.basePrice ?? 0} disabled />

              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={unit}
                inputProps={{ min: 1 }}
                onChange={(event) => setUnit(Math.max(1, Number(event.target.value)))}
                disabled={isLoading}
              />

              {selectedCategory === "domicilio" && (
                <TextField
                  select
                  fullWidth
                  label="Factor de distancia"
                  value={distanceFactor}
                  onChange={(event) => setDistanceFactor(event.target.value)}
                  disabled={isLoading}
                  SelectProps={{ native: true }}
                >
                  {Object.keys(DISTANCE_FACTORS).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </TextField>
              )}

              {(selectedCategory === "hogar" || selectedCategory === "domicilio") && (
                <TextField
                  select
                  fullWidth
                  label="Nivel de complejidad"
                  value={complexityLevel}
                  onChange={(event) => setComplexityLevel(event.target.value)}
                  disabled={isLoading}
                  SelectProps={{ native: true }}
                >
                  {Object.keys(COMPLEXITY_FACTORS).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </TextField>
              )}

              <TextField
                fullWidth
                label="Ajuste del precio base para el cliente (opcional)"
                type="number"
                value={clientBasePriceOverride}
                inputProps={{ min: 1, step: 1 }}
                onChange={(event) => {
                  const value = event.target.value;
                  setClientBasePriceOverride(value === "" ? "" : Number(value));
                }}
                disabled={isLoading}
                helperText="Si se indica un valor mayor que 0, reemplaza el precio base estandar."
              />

              {selectedCategory === "medicos" && (
                <TextField
                  fullWidth
                  label="Costo de insumos medicos (opcional)"
                  type="number"
                  value={medicalSuppliesCost}
                  inputProps={{ min: 0, step: 1 }}
                  onChange={(event) => {
                    const value = event.target.value;
                    setMedicalSuppliesCost(value === "" ? "" : Number(value));
                  }}
                  disabled={isLoading}
                  helperText="Se suma al final del calculo, sin multiplicadores."
                />
              )}

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#f7fff9", mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Estimacion en vivo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Precio unitario = base x categoria x distancia x complejidad x (1 - descuento)
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  base: {basePrice} x categoria: {categoryFactor} x distancia: {distanceFactorValue}
                  {" "}x complejidad: {complexityFactor} x (1 - {volumeDiscount}%)
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Precio unitario: {unitPrice.toFixed(2)} • Cantidad: {unit} • Insumos:{" "}
                  {medicalSupplies.toFixed(2)}
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.5 }}>
                  Total estimado: {estimatedTotal.toFixed(2)}
                </Typography>
              </Paper>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button type="submit" variant="contained" size="large" disabled={!canSubmit}>
                  {isLoading ? (
                    <>
                      <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                      Creando solicitud
                    </>
                  ) : (
                    "Crear solicitud"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  disabled={isLoading}
                  onClick={() => {
                    setCareRequestDescription("");
                    setFeedback(null);
                  }}
                >
                  Limpiar formulario
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>

        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 2.5, bgcolor: "#f3ede0" }}>
            <Typography variant="overline" sx={{ color: "#8c6430", letterSpacing: "0.16em" }}>
              Checklist de envio
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <Alert severity={userId ? "success" : "warning"} variant="outlined">
                {userId ? "Usuario autenticado identificado" : "Falta el identificador del usuario autenticado"}
              </Alert>
              <Alert severity={trimmedDescription.length > 24 ? "success" : "info"} variant="outlined">
                {trimmedDescription.length > 24
                  ? "La descripcion tiene suficiente contexto para triage"
                  : "Agrega una descripcion mas especifica"}
              </Alert>
              <Alert severity={selectedService ? "success" : "error"} variant="outlined">
                Tipo de servicio listo para calcular
              </Alert>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Logs recientes del cliente</Typography>
              <Button size="small" variant="outlined" onClick={() => clearClientLogs()}>
                Limpiar
              </Button>
            </Stack>
            <Stack spacing={1.4} sx={{ mt: 2 }}>
              {latestLogs.length === 0 ? (
                <Typography color="text.secondary">Todavia no hay logs capturados.</Typography>
              ) : (
                latestLogs.map((log) => (
                  <Box
                    key={log.id}
                    sx={{
                      p: 1.6,
                      borderRadius: 2,
                      bgcolor: "rgba(247, 244, 238, 0.72)",
                      border: "1px solid rgba(23, 48, 66, 0.08)",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {log.timestamp} • {log.source} • {log.level.toUpperCase()} • {log.correlationId}
                    </Typography>
                    <Typography sx={{ mt: 0.6, fontWeight: 700 }}>{log.message}</Typography>
                    {log.data && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            whiteSpace: "pre-wrap",
                            fontSize: 12,
                            color: "text.secondary",
                            fontFamily: '"IBM Plex Mono", "SFMono-Regular", monospace',
                          }}
                        >
                          {JSON.stringify(log.data, null, 2)}
                        </Box>
                      </>
                    )}
                  </Box>
                ))
              )}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </WorkspaceShell>
  );
}

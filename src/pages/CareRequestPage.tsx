import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
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
import { FormDatePicker } from "../components/common/FormDatePicker";
import { useAuth } from "../context/AuthContext";
import { useCareRequestCatalogOptions } from "../hooks/useCareRequestCatalogOptions";
import { useAvailableNurses } from "../hooks/useAvailableNurses";
import { careRequestTestIds } from "../testing/careRequestTestIds";
import type { AvailableNurse } from "../api/catalogOptions";
import {
  clearClientLogs,
  createCorrelationId,
  logClientEvent,
  useClientLogs,
} from "../logging/clientLogger";
import { estimateCareRequestPricingFromCatalog } from "../utils/pricingFromCatalogOptions";

export default function CareRequestPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { data: catalogOptions, isLoading: catalogLoading, error: catalogError } =
    useCareRequestCatalogOptions();
  const { data: availableNurses, isLoading: nursesLoading, error: nursesError } =
    useAvailableNurses();
  const [careRequestDescription, setCareRequestDescription] = useState("");
  const [selectedNurse, setSelectedNurse] = useState<AvailableNurse | null>(null);
  const [careRequestDate, setCareRequestDate] = useState("");
  const [careRequestType, setCareRequestType] = useState<string>("");
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

  useEffect(() => {
    if (!catalogOptions?.careRequestTypes.length) {
      return;
    }

    setCareRequestType((prev) => {
      if (prev && catalogOptions.careRequestTypes.some((t) => t.code === prev)) {
        return prev;
      }
      return catalogOptions.careRequestTypes[0]?.code ?? "";
    });
  }, [catalogOptions]);

  const trimmedDescription = careRequestDescription.trim();
  const descriptionCount = trimmedDescription.length;
  const latestLogs = useMemo(() => logs.slice(0, 4), [logs]);

  const selectedService = catalogOptions?.careRequestTypes.find((t) => t.code === careRequestType);
  const selectedCategory = selectedService?.careRequestCategoryCode ?? "";
  const derivedUnitType = selectedService?.unitTypeCode ?? "";

  const categoryDisplayName =
    catalogOptions?.careRequestCategories.find((c) => c.code === selectedCategory)?.displayName ??
    selectedCategory;

  const catalogBasePrice = selectedService?.basePrice ?? 0;
  const basePrice =
    typeof clientBasePriceOverride === "number" && clientBasePriceOverride > 0
      ? clientBasePriceOverride
      : catalogBasePrice;

  const pricingEstimate = useMemo(() => {
    if (!catalogOptions || !careRequestType) {
      return null;
    }

    try {
      return estimateCareRequestPricingFromCatalog(catalogOptions, {
        careRequestTypeCode: careRequestType,
        unit,
        clientBasePriceOverride:
          typeof clientBasePriceOverride === "number" && clientBasePriceOverride > 0
            ? clientBasePriceOverride
            : undefined,
        distanceFactorCode: selectedCategory === "domicilio" ? distanceFactor : undefined,
        complexityLevelCode:
          selectedCategory === "hogar" || selectedCategory === "domicilio"
            ? complexityLevel
            : undefined,
        medicalSuppliesCost:
          selectedCategory === "medicos" && typeof medicalSuppliesCost === "number"
            ? medicalSuppliesCost
            : undefined,
        existingSameUnitTypeCount,
      });
    } catch {
      return null;
    }
  }, [
    catalogOptions,
    careRequestType,
    unit,
    clientBasePriceOverride,
    selectedCategory,
    distanceFactor,
    complexityLevel,
    medicalSuppliesCost,
    existingSameUnitTypeCount,
  ]);

  const isDomicilio = selectedCategory === "domicilio";
  const isHogarOrDomicilio = selectedCategory === "hogar" || isDomicilio;
  const isMedicos = selectedCategory === "medicos";

  const medicalSupplies =
    isMedicos && typeof medicalSuppliesCost === "number" && medicalSuppliesCost >= 0
      ? medicalSuppliesCost
      : 0;

  const unitPrice = pricingEstimate?.unitPriceAfterVolumeDiscount ?? 0;
  const estimatedTotal = pricingEstimate?.grandTotal ?? 0;
  const volumeDiscount = pricingEstimate?.volumeDiscountPercent ?? 0;

  const canSubmit =
    !isLoading
    && !catalogLoading
    && !nursesLoading
    && Boolean(catalogOptions)
    && Boolean(userId)
    && trimmedDescription.length > 0
    && unit > 0
    && Boolean(selectedService)
    && Boolean(pricingEstimate);

  useEffect(() => {
    if (!userId || !derivedUnitType) {
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
          ...(selectedNurse ? { suggestedNurse: selectedNurse.displayName } : {}),
          ...(careRequestDate ? { careRequestDate } : {}),
          ...(typeof clientBasePriceOverride === "number" && clientBasePriceOverride > 0
            ? { clientBasePriceOverride }
            : {}),
          ...(isDomicilio ? { distanceFactor } : {}),
          ...(isHogarOrDomicilio ? { complexityLevel } : {}),
          ...(isMedicos && typeof medicalSuppliesCost === "number" ? { medicalSuppliesCost } : {}),
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
      setSelectedNurse(null);
      setCareRequestDate("");
      navigate(`/care-requests/${response.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      logClientEvent(
        "web.ui",
        "La creacion de la solicitud mostro un error en la interfaz",
        {
          correlationId,
          userId,
          message,
        },
        "error",
      );

      setFeedback({
        type: "error",
        message,
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
        data-testid={careRequestTestIds.create.page}
      >
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
          <Box component="form" onSubmit={handleSubmit} data-testid={careRequestTestIds.create.form}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h4">Formulario de solicitud</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
                  La solicitud se vinculara automaticamente con el usuario autenticado actual.
                  Describe el cuidado requerido con el detalle suficiente para triage y aprobacion.
                </Typography>
              </Box>

              {catalogError && <Alert severity="error">{catalogError}</Alert>}
              {catalogLoading && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={22} />
                  <Typography color="text.secondary">Cargando catalogo de precios...</Typography>
                </Stack>
              )}

              {feedback && (
                <Alert severity={feedback.type} data-testid={careRequestTestIds.create.feedbackBanner}>
                  {feedback.message}
                </Alert>
              )}

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
                disabled={isLoading || catalogLoading}
                helperText={`${descriptionCount} caracteres`}
                data-testid={careRequestTestIds.create.descriptionField}
              />

              <Autocomplete
                options={availableNurses ?? []}
                getOptionLabel={(option) => `${option.displayName} (${option.specialty})`}
                value={selectedNurse}
                onChange={(_, newValue) => setSelectedNurse(newValue)}
                openOnFocus
                filterOptions={(options, { inputValue }) => {
                  const query = inputValue.trim().toLocaleLowerCase();
                  if (!query) {
                    return options;
                  }

                  return options.filter((option) =>
                    [option.displayName, option.specialty, option.category]
                      .filter(Boolean)
                      .some((value) => value.toLocaleLowerCase().includes(query)),
                  );
                }}
                loading={nursesLoading}
                disabled={isLoading || catalogLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Enfermera sugerida (opcional)"
                    placeholder="Busca la enfermera que el cliente prefiere"
                    helperText="Administracion decidira si asigna esta sugerencia u otra enfermera."
                    data-testid={careRequestTestIds.create.suggestedNurseField}
                  />
                )}
                noOptionsText={nursesError ? "Error cargando enfermeras" : "No hay enfermeras disponibles"}
              />

              <FormDatePicker
                fullWidth
                label="Fecha del servicio (opcional)"
                value={careRequestDate}
                onChange={setCareRequestDate}
                disabled={isLoading || catalogLoading}
                slotProps={{
                  textField: {
                    helperText: "Si se indica una fecha futura, la enfermera asignada no podra completar la solicitud antes de ese dia."
                  }
                }}
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
                disabled={isLoading || catalogLoading}
                SelectProps={{ native: true }}
                data-testid={careRequestTestIds.create.serviceTypeSelect}
              >
                {(catalogOptions?.careRequestTypes ?? []).map((row) => (
                  <option key={row.code} value={row.code}>
                    {row.displayName}
                  </option>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Categoria del servicio"
                value={categoryDisplayName}
                disabled
                helperText={`Tipo de unidad: ${derivedUnitType}`}
              />

              <TextField fullWidth label="Precio base" value={catalogBasePrice} disabled />

              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={unit}
                inputProps={{ min: 1 }}
                onChange={(event) => setUnit(Math.max(1, Number(event.target.value)))}
                disabled={isLoading || catalogLoading}
              />

              {isDomicilio && (
                <TextField
                  select
                  fullWidth
                  label="Factor de distancia"
                  value={distanceFactor}
                  onChange={(event) => setDistanceFactor(event.target.value)}
                  disabled={isLoading || catalogLoading}
                  SelectProps={{ native: true }}
                >
                  {(catalogOptions?.distanceFactors ?? []).map((row) => (
                    <option key={row.code} value={row.code}>
                      {row.displayName}
                    </option>
                  ))}
                </TextField>
              )}

              {isHogarOrDomicilio && (
                <TextField
                  select
                  fullWidth
                  label="Nivel de complejidad"
                  value={complexityLevel}
                  onChange={(event) => setComplexityLevel(event.target.value)}
                  disabled={isLoading || catalogLoading}
                  SelectProps={{ native: true }}
                >
                  {(catalogOptions?.complexityLevels ?? []).map((row) => (
                    <option key={row.code} value={row.code}>
                      {row.displayName}
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
                disabled={isLoading || catalogLoading}
                helperText="Si se indica un valor mayor que 0, reemplaza el precio base estandar."
              />

              {isMedicos && (
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
                  disabled={isLoading || catalogLoading}
                  helperText="Se suma al final del calculo, sin multiplicadores."
                />
              )}

              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: "#f7fff9", mt: 2 }}
                data-testid={careRequestTestIds.create.pricingEstimate}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Estimacion en vivo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Precio unitario = base x categoria x distancia x complejidad x (1 - descuento)
                </Typography>
                {pricingEstimate ? (
                  <>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      base: {basePrice} x categoria: {pricingEstimate.categoryFactor} x distancia:{" "}
                      {pricingEstimate.distanceMultiplier} x complejidad: {pricingEstimate.complexityMultiplier} x (1 -{" "}
                      {volumeDiscount}%)
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Precio unitario: {unitPrice.toFixed(2)} • Cantidad: {unit} • Insumos:{" "}
                      {medicalSupplies.toFixed(2)}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5 }}>
                      Total estimado: {estimatedTotal.toFixed(2)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                    {catalogLoading ? "Calculando..." : "Selecciona un tipo de solicitud valido para ver la estimacion."}
                  </Typography>
                )}
              </Paper>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={!canSubmit}
                  data-testid={careRequestTestIds.create.submitButton}
                >
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
                    setSelectedNurse(null);
                    setCareRequestDate("");
                    setFeedback(null);
                  }}
                  data-testid={careRequestTestIds.create.clearButton}
                >
                  Limpiar formulario
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>

        <Stack spacing={3}>
          <Paper
            sx={{ p: 3, borderRadius: 2.5, bgcolor: "#eff5f3" }}
            data-testid={careRequestTestIds.create.submissionChecklist}
          >
            <Typography variant="overline" sx={{ color: "#789588", letterSpacing: "0.16em" }}>
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
                    <>
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
                    </>
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

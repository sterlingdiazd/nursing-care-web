import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  createAdminCareRequest,
  getAdminCareRequestClients,
  type AdminCareRequestClientOption,
} from "../api/adminCareRequests";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  careRequestCategoryFactors,
  careRequestComplexityFactors,
  careRequestDistanceFactors,
  careRequestServiceCatalog,
  formatAdminCareRequestCurrency,
  getVolumeDiscountPercent,
} from "../utils/adminCareRequests";

export default function AdminCreateCareRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { presetClientUserId?: string; backPath?: string } | null;
  const presetClientUserId = locationState?.presetClientUserId ?? "";
  const [clientOptions, setClientOptions] = useState<AdminCareRequestClientOption[]>([]);
  const [clientUserId, setClientUserId] = useState(presetClientUserId);
  const [careRequestDescription, setCareRequestDescription] = useState("");
  const [suggestedNurse, setSuggestedNurse] = useState("");
  const [careRequestDate, setCareRequestDate] = useState("");
  const [careRequestType, setCareRequestType] = useState<string>("domicilio_24h");
  const [unit, setUnit] = useState<number>(1);
  const [distanceFactor, setDistanceFactor] = useState<string>("local");
  const [complexityLevel, setComplexityLevel] = useState<string>("estandar");
  const [clientBasePriceOverride, setClientBasePriceOverride] = useState<number | "">("");
  const [medicalSuppliesCost, setMedicalSuppliesCost] = useState<number | "">("");
  const [existingSameUnitTypeCount, setExistingSameUnitTypeCount] = useState(0);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAdminCareRequestClients()
      .then((response) => setClientOptions(response))
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "No fue posible cargar los clientes.");
      })
      .finally(() => setIsLoadingClients(false));
  }, []);

  useEffect(() => {
    if (!clientUserId) {
      setExistingSameUnitTypeCount(0);
      return;
    }

    setExistingSameUnitTypeCount(0);
  }, [clientUserId, careRequestType]);

  const selectedService = careRequestServiceCatalog[careRequestType];
  const selectedCategory = selectedService.category;
  const basePrice =
    typeof clientBasePriceOverride === "number" && clientBasePriceOverride > 0
      ? clientBasePriceOverride
      : selectedService.basePrice;
  const categoryFactor = careRequestCategoryFactors[selectedCategory];
  const distanceFactorValue =
    selectedCategory === "domicilio"
      ? careRequestDistanceFactors[distanceFactor as keyof typeof careRequestDistanceFactors]?.factor ?? 1.0
      : 1.0;
  const complexityFactorValue =
    selectedCategory === "hogar" || selectedCategory === "domicilio"
      ? careRequestComplexityFactors[complexityLevel as keyof typeof careRequestComplexityFactors]?.factor ?? 1.0
      : 1.0;
  const volumeDiscountPercent = getVolumeDiscountPercent(existingSameUnitTypeCount);
  const unitPrice = basePrice * categoryFactor * distanceFactorValue * complexityFactorValue * (1 - volumeDiscountPercent / 100);
  const medicalSuppliesValue =
    selectedCategory === "medicos" && typeof medicalSuppliesCost === "number" && medicalSuppliesCost >= 0
      ? medicalSuppliesCost
      : 0;
  const estimatedTotal = unitPrice * unit + medicalSuppliesValue;
  const canSubmit =
    !isSaving
    && !isLoadingClients
    && clientUserId.length > 0
    && careRequestDescription.trim().length > 0
    && unit > 0;

  const backPath = locationState?.backPath ?? `/admin/care-requests${location.search}`;
  const selectedClient = useMemo(
    () => clientOptions.find((option) => option.userId === clientUserId) ?? null,
    [clientOptions, clientUserId],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await createAdminCareRequest({
        clientUserId,
        careRequestDescription: careRequestDescription.trim(),
        careRequestType,
        unit,
        suggestedNurse: suggestedNurse.trim() || undefined,
        careRequestDate: careRequestDate || undefined,
        clientBasePriceOverride:
          typeof clientBasePriceOverride === "number" && clientBasePriceOverride > 0
            ? clientBasePriceOverride
            : undefined,
        distanceFactor: selectedCategory === "domicilio" ? distanceFactor : undefined,
        complexityLevel:
          selectedCategory === "hogar" || selectedCategory === "domicilio"
            ? complexityLevel
            : undefined,
        medicalSuppliesCost:
          selectedCategory === "medicos" && typeof medicalSuppliesCost === "number"
            ? medicalSuppliesCost
            : undefined,
      });

      navigate(`/admin/care-requests/${response.id}${location.search}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible crear la solicitud administrativa.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminPortalShell
      eyebrow="Nueva solicitud administrativa"
      title="Crear una solicitud en nombre de un cliente activo."
      description="Administracion puede registrar solicitudes para clientes cuando el caso lo requiera, manteniendo el mismo motor de calculo y las mismas reglas operativas del flujo regular."
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate(backPath)}>
            Volver al modulo
          </Button>
          <Button variant="contained" onClick={() => navigate("/admin/care-requests")} disabled={isSaving}>
            Ver lista
          </Button>
        </>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.1fr 0.9fr" },
          gap: 3,
        }}
      >
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3.5 }}>
          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              select
              label="Cliente"
              value={clientUserId}
              onChange={(event) => setClientUserId(event.target.value)}
              SelectProps={{ native: true }}
              disabled={isLoadingClients || isSaving}
              helperText="Selecciona el cliente que sera propietario de la solicitud."
            >
              <option value="">Selecciona un cliente activo</option>
              {clientOptions.map((client) => (
                <option key={client.userId} value={client.userId}>
                  {`${client.displayName} · ${client.email}`}
                </option>
              ))}
            </TextField>

            <TextField
              label="Descripcion de la solicitud"
              multiline
              rows={6}
              value={careRequestDescription}
              onChange={(event) => setCareRequestDescription(event.target.value)}
              disabled={isSaving}
            />

            <TextField
              label="Enfermera sugerida (opcional)"
              value={suggestedNurse}
              onChange={(event) => setSuggestedNurse(event.target.value)}
              disabled={isSaving}
            />

            <TextField
              label="Fecha del servicio (opcional)"
              type="date"
              value={careRequestDate}
              onChange={(event) => setCareRequestDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isSaving}
            />

            <TextField
              select
              label="Tipo de solicitud"
              value={careRequestType}
              onChange={(event) => setCareRequestType(event.target.value)}
              SelectProps={{ native: true }}
              disabled={isSaving}
            >
              {Object.entries(careRequestServiceCatalog).map(([value, option]) => (
                <option key={value} value={value}>
                  {option.label}
                </option>
              ))}
            </TextField>

            <TextField
              label="Cantidad"
              type="number"
              value={unit}
              inputProps={{ min: 1 }}
              onChange={(event) => setUnit(Math.max(1, Number(event.target.value)))}
              disabled={isSaving}
            />

            {selectedCategory === "domicilio" && (
              <TextField
                select
                label="Factor de distancia"
                value={distanceFactor}
                onChange={(event) => setDistanceFactor(event.target.value)}
                SelectProps={{ native: true }}
                disabled={isSaving}
              >
                {Object.entries(careRequestDistanceFactors).map(([value, option]) => (
                  <option key={value} value={value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            )}

            {(selectedCategory === "hogar" || selectedCategory === "domicilio") && (
              <TextField
                select
                label="Nivel de complejidad"
                value={complexityLevel}
                onChange={(event) => setComplexityLevel(event.target.value)}
                SelectProps={{ native: true }}
                disabled={isSaving}
              >
                {Object.entries(careRequestComplexityFactors).map(([value, option]) => (
                  <option key={value} value={value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            )}

            <TextField
              label="Ajuste del precio base para el cliente (opcional)"
              type="number"
              value={clientBasePriceOverride}
              inputProps={{ min: 1, step: 1 }}
              onChange={(event) => {
                const value = event.target.value;
                setClientBasePriceOverride(value === "" ? "" : Number(value));
              }}
              disabled={isSaving}
            />

            {selectedCategory === "medicos" && (
              <TextField
                label="Costo de insumos medicos (opcional)"
                type="number"
                value={medicalSuppliesCost}
                inputProps={{ min: 0, step: 1 }}
                onChange={(event) => {
                  const value = event.target.value;
                  setMedicalSuppliesCost(value === "" ? "" : Number(value));
                }}
                disabled={isSaving}
              />
            )}

            <Button type="submit" variant="contained" disabled={!canSubmit}>
              Crear solicitud administrativa
            </Button>
          </Stack>
        </Paper>

        <Stack spacing={3}>
          <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
            <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
              Cliente seleccionado
            </Typography>
            <Stack spacing={1.2} sx={{ mt: 2.2 }}>
              <Typography variant="h5">{selectedClient?.displayName ?? "Sin cliente seleccionado"}</Typography>
              <Typography color="text.secondary">{selectedClient?.email ?? "Selecciona un cliente para continuar."}</Typography>
              <Typography color="text.secondary">
                {selectedClient?.identificationNumber ? `Cedula ${selectedClient.identificationNumber}` : "Sin cedula visible"}
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3.5, borderRadius: 3.5, bgcolor: "#f7fff9" }}>
            <Typography variant="overline" sx={{ color: "#1f5a49", letterSpacing: "0.16em" }}>
              Estimacion previa
            </Typography>
            <Stack spacing={1.2} sx={{ mt: 2.2 }}>
              {[
                ["Precio base", formatAdminCareRequestCurrency(basePrice)],
                ["Factor de categoria", categoryFactor.toFixed(2)],
                ["Factor de distancia", distanceFactorValue.toFixed(2)],
                ["Factor de complejidad", complexityFactorValue.toFixed(2)],
                ["Descuento por volumen", `${volumeDiscountPercent}%`],
                ["Precio unitario estimado", formatAdminCareRequestCurrency(unitPrice)],
                ["Insumos medicos", formatAdminCareRequestCurrency(medicalSuppliesValue)],
                ["Total estimado", formatAdminCareRequestCurrency(estimatedTotal)],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
                  <Typography color="text.secondary">{value}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </AdminPortalShell>
  );
}

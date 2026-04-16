import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
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
import { FormDatePicker } from "../components/common/FormDatePicker";
import { useCareRequestCatalogOptions } from "../hooks/useCareRequestCatalogOptions";
import { useAvailableNurses } from "../hooks/useAvailableNurses";
import type { AvailableNurse } from "../api/catalogOptions";
import { estimateCareRequestPricingFromCatalog } from "../utils/pricingFromCatalogOptions";
import { formatAdminCareRequestCurrency } from "../utils/adminCareRequests";
import { extractApiErrorMessage } from "../api/errorMessage";

export default function AdminCreateCareRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: catalogOptions, isLoading: catalogLoading, error: catalogError } =
    useCareRequestCatalogOptions();
  const { data: availableNurses, isLoading: nursesLoading, error: nursesError } = useAvailableNurses();
  const locationState = location.state as { presetClientUserId?: string; backPath?: string } | null;
  const presetClientUserId = locationState?.presetClientUserId ?? "";
  const [clientOptions, setClientOptions] = useState<AdminCareRequestClientOption[]>([]);
  const [clientUserId, setClientUserId] = useState(presetClientUserId);
  const [careRequestDescription, setCareRequestDescription] = useState("");
  const [selectedNurse, setSelectedNurse] = useState<AvailableNurse | null>(null);
  const [careRequestDate, setCareRequestDate] = useState("");
  const [careRequestType, setCareRequestType] = useState<string>("");
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

  useEffect(() => {
    if (!clientUserId) {
      setExistingSameUnitTypeCount(0);
      return;
    }

    setExistingSameUnitTypeCount(0);
  }, [clientUserId, careRequestType]);

  const selectedService = catalogOptions?.careRequestTypes.find((t) => t.code === careRequestType);
  const selectedCategory = selectedService?.careRequestCategoryCode ?? "";
  const isDomicilio = selectedCategory === "domicilio";
  const isHogarOrDomicilio = selectedCategory === "hogar" || isDomicilio;
  const isMedicos = selectedCategory === "medicos";

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
        distanceFactorCode: isDomicilio ? distanceFactor : undefined,
        complexityLevelCode: isHogarOrDomicilio ? complexityLevel : undefined,
        medicalSuppliesCost:
          isMedicos && typeof medicalSuppliesCost === "number" ? medicalSuppliesCost : undefined,
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
    isDomicilio,
    isHogarOrDomicilio,
    isMedicos,
    distanceFactor,
    complexityLevel,
    medicalSuppliesCost,
    existingSameUnitTypeCount,
  ]);

  const unitPrice = pricingEstimate?.unitPriceAfterVolumeDiscount ?? 0;
  const medicalSuppliesValue =
    isMedicos && typeof medicalSuppliesCost === "number" && medicalSuppliesCost >= 0
      ? medicalSuppliesCost
      : 0;
  const estimatedTotal = pricingEstimate?.grandTotal ?? 0;
  const volumeDiscountPercent = pricingEstimate?.volumeDiscountPercent ?? 0;
  const distanceFactorValue = pricingEstimate?.distanceMultiplier ?? 1;
  const complexityFactorValue = pricingEstimate?.complexityMultiplier ?? 1;
  const categoryFactor = pricingEstimate?.categoryFactor ?? 0;

  const canSubmit =
    !isSaving
    && !isLoadingClients
    && !catalogLoading
    && Boolean(catalogOptions)
    && Boolean(pricingEstimate)
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
        suggestedNurse: selectedNurse?.displayName || undefined,
        careRequestDate: careRequestDate || undefined,
        clientBasePriceOverride:
          typeof clientBasePriceOverride === "number" && clientBasePriceOverride > 0
            ? clientBasePriceOverride
            : undefined,
        distanceFactor: isDomicilio ? distanceFactor : undefined,
        complexityLevel: isHogarOrDomicilio ? complexityLevel : undefined,
        medicalSuppliesCost:
          isMedicos && typeof medicalSuppliesCost === "number" ? medicalSuppliesCost : undefined,
      });

      navigate(`/admin/care-requests/${response.id}${location.search}`);
    } catch (nextError) {
      setError(extractApiErrorMessage(nextError, "No fue posible crear la solicitud administrativa."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminPortalShell
      eyebrow="Nueva solicitud administrativa"
      title="Crear una solicitud en nombre de un cliente activo"
      description=""
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
          gridTemplateColumns: { xs: "1fr", xl: "1.15fr 0.85fr" },
          gap: 3,
        }}
      >
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3.5 }}>
          <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error">{error}</Alert>}
            {catalogError && <Alert severity="error">{catalogError}</Alert>}

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
              disabled={isSaving}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Enfermera sugerida (opcional)"
                  placeholder="Busca la enfermera que el cliente prefiere"
                />
              )}
              noOptionsText={nursesError ? "Error cargando enfermeras" : "No hay enfermeras disponibles"}
            />

            <FormDatePicker
              label="Fecha del servicio (opcional)"
              value={careRequestDate}
              onChange={setCareRequestDate}
              disabled={isSaving}
              slotProps={{
                textField: {
                  "data-testid": "admin-create-care-request-date-input",
                }
              }}
            />

            <TextField
              select
              label="Tipo de solicitud"
              value={careRequestType}
              onChange={(event) => setCareRequestType(event.target.value)}
              SelectProps={{ native: true }}
              disabled={isSaving || catalogLoading}
            >
              {(catalogOptions?.careRequestTypes ?? []).map((row) => (
                <option key={row.code} value={row.code}>
                  {row.displayName}
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

            {isDomicilio && (
              <TextField
                select
                label="Factor de distancia"
                value={distanceFactor}
                onChange={(event) => setDistanceFactor(event.target.value)}
                SelectProps={{ native: true }}
                disabled={isSaving || catalogLoading}
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
                label="Nivel de complejidad"
                value={complexityLevel}
                onChange={(event) => setComplexityLevel(event.target.value)}
                SelectProps={{ native: true }}
                disabled={isSaving || catalogLoading}
              >
                {(catalogOptions?.complexityLevels ?? []).map((row) => (
                  <option key={row.code} value={row.code}>
                    {row.displayName}
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

            {isMedicos && (
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
          <Paper sx={{ p: 3.5, borderRadius: 3.5, bgcolor: "#f7fff9" }}>
            <Typography variant="overline" sx={{ color: "#1f5a49", letterSpacing: "0.16em" }}>
              Desglose de precios
            </Typography>
            <Stack spacing={1.8} sx={{ mt: 2.2 }}>
              {[
                ["Precio base", formatAdminCareRequestCurrency(basePrice)],
                ["Factor de categoria", categoryFactor.toFixed(2)],
                ...(isDomicilio ? [["Factor de distancia", distanceFactorValue.toFixed(2)]] : []),
                ...(isHogarOrDomicilio ? [["Factor de complejidad", complexityFactorValue.toFixed(2)]] : []),
                ["Descuento por volumen", `${volumeDiscountPercent}%`],
                ["Precio unitario", formatAdminCareRequestCurrency(unitPrice)],
                ...(isMedicos && medicalSuppliesValue > 0 ? [["Insumos medicos", formatAdminCareRequestCurrency(medicalSuppliesValue)]] : []),
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontWeight: 500, color: "text.primary" }}>{label}</Typography>
                  <Typography sx={{ fontWeight: 700, color: "#1f5a49" }}>{value}</Typography>
                </Box>
              ))}
              <Box sx={{ pt: 1.5, borderTop: "2px solid rgba(31, 90, 73, 0.2)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>Total estimado</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#1f5a49" }}>
                    {formatAdminCareRequestCurrency(estimatedTotal)}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </AdminPortalShell>
  );
}

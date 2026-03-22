import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AdminPortalShell from "../components/layout/AdminPortalShell";
import { nurseCategories, nurseSpecialties } from "../constants/nurseProfileOptions";
import {
  completeNurseProfileForAdmin,
  getActiveNurseProfiles,
  getNurseProfileForAdmin,
  getPendingNurseProfiles,
  type ActiveNurseProfileSummary,
  type CompleteNurseProfileRequest,
  type NurseProfileAdminRecord,
  type PendingNurseProfile,
} from "../api/adminNurseProfiles";
import {
  getExactDigitsFieldError,
  getOptionalDigitsFieldError,
  getRejectedDigitsOnlyInputError,
  getRejectedTextOnlyInputError,
  getTextOnlyFieldError,
  sanitizeDigitsOnlyInput,
  sanitizeTextOnlyInput,
} from "../utils/identityValidation";

type FormState = CompleteNurseProfileRequest;
type NurseProfilesView = "pending" | "active";

interface NurseProfileListItem {
  userId: string;
  email: string;
  name: string | null;
  lastName: string | null;
  helperText: string;
}

const emptyForm: FormState = {
  name: "",
  lastName: "",
  identificationNumber: "",
  phone: "",
  email: "",
  hireDate: "",
  specialty: "",
  licenseId: "",
  bankName: "",
  accountNumber: "",
  category: "",
};

function toFormState(profile: NurseProfileAdminRecord): FormState {
  return {
    name: profile.name ?? "",
    lastName: profile.lastName ?? "",
    identificationNumber: profile.identificationNumber ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    hireDate: profile.hireDate ?? "",
    specialty: profile.specialty ?? "",
    licenseId: profile.licenseId ?? "",
    bankName: profile.bankName ?? "",
    accountNumber: profile.accountNumber ?? "",
    category: profile.category ?? "",
  };
}

export default function AdminNurseProfilesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [listItems, setListItems] = useState<NurseProfileListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<NurseProfileAdminRecord | null>(null);
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nameInputError, setNameInputError] = useState("");
  const [lastNameInputError, setLastNameInputError] = useState("");
  const [identificationNumberInputError, setIdentificationNumberInputError] = useState("");
  const [phoneInputError, setPhoneInputError] = useState("");
  const [licenseIdInputError, setLicenseIdInputError] = useState("");
  const [bankNameInputError, setBankNameInputError] = useState("");
  const [accountNumberInputError, setAccountNumberInputError] = useState("");
  const nameError = useMemo(() => getTextOnlyFieldError(formState.name, "El nombre"), [formState.name]);
  const lastNameError = useMemo(() => getTextOnlyFieldError(formState.lastName, "El apellido"), [formState.lastName]);
  const identificationNumberError = useMemo(
    () => getExactDigitsFieldError(formState.identificationNumber, "La cedula", 11),
    [formState.identificationNumber],
  );
  const phoneError = useMemo(
    () => getExactDigitsFieldError(formState.phone, "El telefono", 10),
    [formState.phone],
  );
  const licenseIdError = useMemo(
    () => getOptionalDigitsFieldError(formState.licenseId ?? "", "La licencia"),
    [formState.licenseId],
  );
  const bankNameError = useMemo(() => getTextOnlyFieldError(formState.bankName, "El banco"), [formState.bankName]);
  const accountNumberError = useMemo(
    () => getOptionalDigitsFieldError(formState.accountNumber ?? "", "El numero de cuenta"),
    [formState.accountNumber],
  );
  const displayedNameError = nameInputError || (formState.name.length > 0 ? nameError : "");
  const displayedLastNameError = lastNameInputError || (formState.lastName.length > 0 ? lastNameError : "");
  const displayedIdentificationNumberError =
    identificationNumberInputError
    || (formState.identificationNumber.length > 0 ? identificationNumberError : "");
  const displayedPhoneError = phoneInputError || (formState.phone.length > 0 ? phoneError : "");
  const displayedLicenseIdError =
    licenseIdInputError || ((formState.licenseId ?? "").length > 0 ? licenseIdError : "");
  const displayedBankNameError = bankNameInputError || (formState.bankName.length > 0 ? bankNameError : "");
  const displayedAccountNumberError =
    accountNumberInputError || ((formState.accountNumber ?? "").length > 0 ? accountNumberError : "");
  const currentView: NurseProfilesView =
    new URLSearchParams(location.search).get("view") === "active" ? "active" : "pending";
  const isReadOnlyView = currentView === "active";

  const canSubmit = useMemo(
    () =>
      !isReadOnlyView &&
      !isSaving &&
      !displayedNameError &&
      !displayedLastNameError &&
      !displayedIdentificationNumberError &&
      !displayedPhoneError &&
      formState.email.trim().length > 0 &&
      formState.hireDate.trim().length > 0 &&
      formState.specialty.trim().length > 0 &&
      !displayedLicenseIdError &&
      !displayedBankNameError &&
      !displayedAccountNumberError &&
      formState.category.trim().length > 0,
    [
      displayedAccountNumberError,
      displayedBankNameError,
      displayedIdentificationNumberError,
      displayedLastNameError,
      displayedLicenseIdError,
      displayedNameError,
      displayedPhoneError,
      formState,
      isReadOnlyView,
      isSaving,
    ],
  );

  const mapPendingProfile = (profile: PendingNurseProfile): NurseProfileListItem => ({
    userId: profile.userId,
    email: profile.email,
    name: profile.name,
    lastName: profile.lastName,
    helperText: `Creado: ${new Date(profile.createdAtUtc).toLocaleString()}`,
  });

  const mapActiveProfile = (profile: ActiveNurseProfileSummary): NurseProfileListItem => ({
    userId: profile.userId,
    email: profile.email,
    name: profile.name,
    lastName: profile.lastName,
    helperText:
      [profile.specialty, profile.category].filter(Boolean).join(" · ") || "Perfil activo listo para asignacion",
  });

  const loadProfileList = async (preferredUserId?: string | null, nextView: NurseProfilesView = currentView) => {
    setIsLoadingList(true);
    setError(null);

    try {
      const nextItems =
        nextView === "pending"
          ? (await getPendingNurseProfiles()).map(mapPendingProfile)
          : (await getActiveNurseProfiles()).map(mapActiveProfile);

      setListItems(nextItems);

      const nextSelected =
        preferredUserId && nextItems.some((item) => item.userId === preferredUserId)
          ? preferredUserId
          : nextItems[0]?.userId ?? null;

      setSelectedUserId(nextSelected);
      setSuccessMessage((current) => current);
      return nextItems;
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : nextView === "pending"
            ? "No fue posible cargar los perfiles pendientes."
            : "No fue posible cargar las enfermeras activas.",
      );
      return [];
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadProfile = async (userId: string) => {
    setIsLoadingDetail(true);
    setError(null);

    try {
      const profile = await getNurseProfileForAdmin(userId);
      setSelectedProfile(profile);
      setFormState(toFormState(profile));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar el perfil.");
      setSelectedProfile(null);
      setFormState(emptyForm);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    void loadProfileList(selectedUserId, currentView);
  }, [currentView]);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedProfile(null);
      setFormState(emptyForm);
      return;
    }

    void loadProfile(selectedUserId);
  }, [selectedUserId]);

  const handleChange = (field: keyof FormState, value: string) => {
    const nextValue = (() => {
      switch (field) {
        case "name":
        case "lastName":
        case "bankName":
          return sanitizeTextOnlyInput(value);
        case "identificationNumber":
          return sanitizeDigitsOnlyInput(value, 11);
        case "phone":
          return sanitizeDigitsOnlyInput(value, 10);
        case "licenseId":
        case "accountNumber":
          return sanitizeDigitsOnlyInput(value);
        default:
          return value;
      }
    })();

    switch (field) {
      case "name":
        setNameInputError(getRejectedTextOnlyInputError(value, "El nombre"));
        break;
      case "lastName":
        setLastNameInputError(getRejectedTextOnlyInputError(value, "El apellido"));
        break;
      case "identificationNumber":
        setIdentificationNumberInputError(getRejectedDigitsOnlyInputError(value, "La cedula", 11));
        break;
      case "phone":
        setPhoneInputError(getRejectedDigitsOnlyInputError(value, "El telefono", 10));
        break;
      case "licenseId":
        setLicenseIdInputError(getRejectedDigitsOnlyInputError(value, "La licencia"));
        break;
      case "bankName":
        setBankNameInputError(getRejectedTextOnlyInputError(value, "El banco"));
        break;
      case "accountNumber":
        setAccountNumberInputError(getRejectedDigitsOnlyInputError(value, "El numero de cuenta"));
        break;
    }

    setFormState((current) => ({
      ...current,
      [field]: nextValue,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedUserId || !canSubmit) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const completed = await completeNurseProfileForAdmin(selectedUserId, {
        ...formState,
        licenseId: (formState.licenseId ?? "").trim() || null,
        accountNumber: (formState.accountNumber ?? "").trim() || null,
      });

      setSelectedProfile(completed);
      setFormState(toFormState(completed));
      setSuccessMessage("El perfil de enfermeria fue completado correctamente.");

      const currentUserId = selectedUserId;
      const nextPending = await loadProfileList(currentUserId, "pending");

      if (!nextPending.some((item) => item.userId === currentUserId)) {
        setSelectedProfile(null);
        setFormState(emptyForm);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible completar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminPortalShell
      eyebrow="Administracion de enfermeria"
      title="Perfiles pendientes y fuerza activa dentro del portal admin."
      description="El tablero puede aterrizar tanto en perfiles pendientes como en enfermeras activas. Esta vista ya vive dentro del portal administrativo y conserva el flujo de revision sin mezclarlo con la consola operativa general."
      actions={
        <>
          <Button
            variant={currentView === "pending" ? "contained" : "text"}
            onClick={() => navigate("/admin/nurse-profiles?view=pending")}
          >
            Pendientes
          </Button>
          <Button
            variant={currentView === "active" ? "contained" : "text"}
            onClick={() => navigate("/admin/nurse-profiles?view=active")}
          >
            Activas
          </Button>
          <Button variant="outlined" onClick={() => void loadProfileList(selectedUserId)} disabled={isLoadingList}>
            Actualizar lista
          </Button>
        </>
      }
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "320px minmax(0, 1fr)" },
            gap: 3,
          }}
        >
          <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{ p: 2.5, borderBottom: "1px solid rgba(23, 48, 66, 0.08)" }}>
              <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                {currentView === "pending" ? "Pendientes" : "Activas"}
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {currentView === "pending" ? "Perfiles por completar" : "Enfermeras listas para asignacion"}
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.7 }}>
                {isLoadingList
                  ? "Actualizando la lista de enfermeria."
                  : listItems.length === 0
                    ? currentView === "pending"
                      ? "No hay perfiles pendientes en este momento."
                      : "No hay enfermeras activas registradas en este momento."
                    : currentView === "pending"
                      ? "Selecciona un perfil para revisar y completar sus datos administrativos."
                      : "Selecciona una enfermera activa para inspeccionar el perfil combinado ya habilitado."}
              </Typography>
            </Box>

            <List disablePadding>
              {listItems.map((profile) => {
                const selected = profile.userId === selectedUserId;

                return (
                  <ListItemButton
                    key={profile.userId}
                    selected={selected}
                    onClick={() => setSelectedUserId(profile.userId)}
                    sx={{
                      px: 2.5,
                      py: 2,
                      alignItems: "flex-start",
                    }}
                  >
                    <ListItemText
                      primary={`${profile.name ?? "Sin nombre"} ${profile.lastName ?? ""}`.trim() || profile.email}
                      secondary={
                        <>
                          <Typography component="span" display="block" sx={{ mt: 0.6 }}>
                            {profile.email}
                          </Typography>
                          <Typography component="span" display="block" sx={{ mt: 0.4 }}>
                            {profile.helperText}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
            {!selectedUserId ? (
              <Alert severity="info" variant="outlined">
                {currentView === "pending"
                  ? "No hay perfiles pendientes para completar."
                  : "No hay perfiles activos para inspeccionar."}
              </Alert>
            ) : (
              <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
                <Box>
                  <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                    Perfil combinado
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    Usuario y enfermeria
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                    <Chip
                      label={selectedProfile?.userIsActive ? "Usuario activo" : "Usuario pendiente"}
                      color={selectedProfile?.userIsActive ? "success" : "warning"}
                      variant="outlined"
                    />
                    <Chip
                      label={selectedProfile?.nurseProfileIsActive ? "Perfil de enfermeria activo" : "Perfil de enfermeria pendiente"}
                      color={selectedProfile?.nurseProfileIsActive ? "success" : "warning"}
                      variant="outlined"
                    />
                  </Stack>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Nombre"
                    value={formState.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                    error={!!displayedNameError}
                    helperText={displayedNameError || "Solo letras y espacios."}
                  />
                  <TextField
                    label="Apellido"
                    value={formState.lastName}
                    onChange={(event) => handleChange("lastName", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                    error={!!displayedLastNameError}
                    helperText={displayedLastNameError || "Solo letras y espacios."}
                  />
                  <TextField
                    label="Cedula"
                    value={formState.identificationNumber}
                    onChange={(event) => handleChange("identificationNumber", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                    error={!!displayedIdentificationNumberError}
                    helperText={displayedIdentificationNumberError || "Debe tener exactamente 11 digitos."}
                    inputProps={{ inputMode: "numeric", pattern: "\\d*", maxLength: 11 }}
                  />
                  <TextField
                    label="Telefono"
                    value={formState.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                    error={!!displayedPhoneError}
                    helperText={displayedPhoneError || "Debe tener exactamente 10 digitos."}
                    inputProps={{ inputMode: "numeric", pattern: "\\d*", maxLength: 10 }}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={formState.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                  />
                  <TextField
                    label="Fecha de contratacion"
                    type="date"
                    value={formState.hireDate}
                    onChange={(event) => handleChange("hireDate", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    select
                    label="Especialidad"
                    value={formState.specialty}
                    onChange={(event) => handleChange("specialty", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                  >
                    {nurseSpecialties.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Licencia"
                    value={formState.licenseId ?? ""}
                    onChange={(event) => handleChange("licenseId", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                    error={!!displayedLicenseIdError}
                    helperText={displayedLicenseIdError || "Opcional. Solo numeros."}
                    inputProps={{ inputMode: "numeric", pattern: "\\d*" }}
                  />
                  <TextField
                    label="Banco"
                    value={formState.bankName}
                    onChange={(event) => handleChange("bankName", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                    error={!!displayedBankNameError}
                    helperText={displayedBankNameError || "Solo letras y espacios."}
                  />
                  <TextField
                    label="Numero de cuenta"
                    value={formState.accountNumber ?? ""}
                    onChange={(event) => handleChange("accountNumber", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                    error={!!displayedAccountNumberError}
                    helperText={displayedAccountNumberError || "Opcional. Solo numeros."}
                    inputProps={{ inputMode: "numeric", pattern: "\\d*" }}
                  />
                  <TextField
                    select
                    label="Categoria"
                    value={formState.category}
                    onChange={(event) => handleChange("category", event.target.value)}
                    disabled={isLoadingDetail || isSaving || isReadOnlyView}
                  >
                    {nurseCategories.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  {!isReadOnlyView && (
                    <Button type="submit" variant="contained" disabled={!canSubmit || isLoadingDetail}>
                      Completar perfil de enfermeria
                    </Button>
                  )}
                  <Button
                    variant="text"
                    onClick={() => selectedUserId && void loadProfile(selectedUserId)}
                    disabled={!selectedUserId || isLoadingDetail || isSaving}
                  >
                    Recargar perfil
                  </Button>
                </Stack>

                {isReadOnlyView && (
                  <Alert severity="success" variant="outlined">
                    Esta enfermera ya tiene un perfil administrativo activo y disponible para asignacion.
                  </Alert>
                )}
              </Stack>
            )}
          </Paper>
        </Box>
      </Stack>
    </AdminPortalShell>
  );
}

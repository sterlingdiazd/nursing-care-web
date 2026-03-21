import React, { useEffect, useMemo, useState } from "react";
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

import WorkspaceShell from "../components/layout/WorkspaceShell";
import {
  completeNurseProfileForAdmin,
  getNurseProfileForAdmin,
  getPendingNurseProfiles,
  type CompleteNurseProfileRequest,
  type NurseProfileAdminRecord,
  type PendingNurseProfile,
} from "../api/adminNurseProfiles";
import {
  getExactDigitsFieldError,
  getOptionalDigitsFieldError,
  getTextOnlyFieldError,
  sanitizeDigitsOnlyInput,
  sanitizeTextOnlyInput,
} from "../utils/identityValidation";

const nurseSpecialties = [
  "Adult Care",
  "Pediatric Care",
  "Geriatric Care",
  "Critical Care",
  "Home Care",
];

const nurseCategories = [
  "Junior",
  "Semi Senior",
  "Senior",
  "Lead",
];

type FormState = CompleteNurseProfileRequest;

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
  const [pendingProfiles, setPendingProfiles] = useState<PendingNurseProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<NurseProfileAdminRecord | null>(null);
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  const canSubmit = useMemo(
    () =>
      !isSaving &&
      !nameError &&
      !lastNameError &&
      !identificationNumberError &&
      !phoneError &&
      formState.email.trim().length > 0 &&
      formState.hireDate.trim().length > 0 &&
      formState.specialty.trim().length > 0 &&
      !licenseIdError &&
      !bankNameError &&
      !accountNumberError &&
      formState.category.trim().length > 0,
    [
      accountNumberError,
      bankNameError,
      formState,
      identificationNumberError,
      isSaving,
      lastNameError,
      licenseIdError,
      nameError,
      phoneError,
    ],
  );

  const loadPendingProfiles = async (preferredUserId?: string | null) => {
    setIsLoadingList(true);
    setError(null);

    try {
      const nextPending = await getPendingNurseProfiles();
      setPendingProfiles(nextPending);

      const nextSelected =
        preferredUserId && nextPending.some((item) => item.userId === preferredUserId)
          ? preferredUserId
          : nextPending[0]?.userId ?? null;

      setSelectedUserId(nextSelected);
      setSuccessMessage((current) => current);
      return nextPending;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar los perfiles pendientes.");
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
    void loadPendingProfiles();
  }, []);

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
        licenseId: formState.licenseId.trim() || null,
        accountNumber: formState.accountNumber.trim() || null,
      });

      setSelectedProfile(completed);
      setFormState(toFormState(completed));
      setSuccessMessage("El perfil de enfermeria fue completado correctamente.");

      const currentUserId = selectedUserId;
      const nextPending = await loadPendingProfiles(currentUserId);

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
    <WorkspaceShell
      eyebrow="Administracion clinica"
      title="Completa perfiles de enfermeria desde una sola vista."
      description="Revisa las cuentas pendientes, abre el perfil combinado de usuario y enfermeria, y finaliza la creacion sin salir de este flujo."
      actions={
        <Button variant="outlined" onClick={() => void loadPendingProfiles(selectedUserId)} disabled={isLoadingList}>
          Actualizar pendientes
        </Button>
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
                Pendientes
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                Perfiles por completar
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.7 }}>
                {isLoadingList
                  ? "Actualizando la lista de enfermeria pendiente."
                  : pendingProfiles.length === 0
                    ? "No hay perfiles pendientes en este momento."
                    : "Selecciona un perfil para revisar y completar sus datos administrativos."}
              </Typography>
            </Box>

            <List disablePadding>
              {pendingProfiles.map((profile) => {
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
                            Creado: {new Date(profile.createdAtUtc).toLocaleString()}
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
                No hay perfiles pendientes para completar.
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
                    disabled={isLoadingDetail || isSaving}
                    error={formState.name.length > 0 && !!nameError}
                    helperText={formState.name.length > 0 && nameError ? nameError : "Solo letras y espacios."}
                  />
                  <TextField
                    label="Apellido"
                    value={formState.lastName}
                    onChange={(event) => handleChange("lastName", event.target.value)}
                    disabled={isLoadingDetail || isSaving}
                    error={formState.lastName.length > 0 && !!lastNameError}
                    helperText={formState.lastName.length > 0 && lastNameError ? lastNameError : "Solo letras y espacios."}
                  />
                  <TextField
                    label="Cedula"
                    value={formState.identificationNumber}
                    onChange={(event) => handleChange("identificationNumber", event.target.value)}
                    disabled={isLoadingDetail || isSaving}
                    error={formState.identificationNumber.length > 0 && !!identificationNumberError}
                    helperText={
                      formState.identificationNumber.length > 0 && identificationNumberError
                        ? identificationNumberError
                        : "Debe tener exactamente 11 digitos."
                    }
                    inputProps={{ inputMode: "numeric", pattern: "\\d*", maxLength: 11 }}
                  />
                  <TextField
                    label="Telefono"
                    value={formState.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    disabled={isLoadingDetail || isSaving}
                    error={formState.phone.length > 0 && !!phoneError}
                    helperText={formState.phone.length > 0 && phoneError ? phoneError : "Debe tener exactamente 10 digitos."}
                    inputProps={{ inputMode: "numeric", pattern: "\\d*", maxLength: 10 }}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={formState.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    disabled={isLoadingDetail || isSaving}
                  />
                  <TextField
                    label="Fecha de contratacion"
                    type="date"
                    value={formState.hireDate}
                    onChange={(event) => handleChange("hireDate", event.target.value)}
                    disabled={isLoadingDetail || isSaving}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    select
                    label="Especialidad"
                    value={formState.specialty}
                    onChange={(event) => handleChange("specialty", event.target.value)}
                    disabled={isLoadingDetail || isSaving}
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
                    disabled={isLoadingDetail || isSaving}
                    error={(formState.licenseId ?? "").length > 0 && !!licenseIdError}
                    helperText={(formState.licenseId ?? "").length > 0 && licenseIdError ? licenseIdError : "Opcional. Solo numeros."}
                    inputProps={{ inputMode: "numeric", pattern: "\\d*" }}
                  />
                  <TextField
                    label="Banco"
                    value={formState.bankName}
                    onChange={(event) => handleChange("bankName", event.target.value)}
                    disabled={isLoadingDetail || isSaving}
                    error={formState.bankName.length > 0 && !!bankNameError}
                    helperText={formState.bankName.length > 0 && bankNameError ? bankNameError : "Solo letras y espacios."}
                  />
                  <TextField
                    label="Numero de cuenta"
                    value={formState.accountNumber ?? ""}
                    onChange={(event) => handleChange("accountNumber", event.target.value)}
                    disabled={isLoadingDetail || isSaving}
                    error={(formState.accountNumber ?? "").length > 0 && !!accountNumberError}
                    helperText={
                      (formState.accountNumber ?? "").length > 0 && accountNumberError
                        ? accountNumberError
                        : "Opcional. Solo numeros."
                    }
                    inputProps={{ inputMode: "numeric", pattern: "\\d*" }}
                  />
                  <TextField
                    select
                    label="Categoria"
                    value={formState.category}
                    onChange={(event) => handleChange("category", event.target.value)}
                    disabled={isLoadingDetail || isSaving}
                  >
                    {nurseCategories.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button type="submit" variant="contained" disabled={!canSubmit || isLoadingDetail}>
                    Completar perfil de enfermeria
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => selectedUserId && void loadProfile(selectedUserId)}
                    disabled={!selectedUserId || isLoadingDetail || isSaving}
                  >
                    Recargar perfil
                  </Button>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Box>
      </Stack>
    </WorkspaceShell>
  );
}

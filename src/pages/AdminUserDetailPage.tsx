import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  getAdminUserDetail,
  invalidateAdminUserSessions,
  updateAdminUser,
  updateAdminUserActiveState,
  updateAdminUserRoles,
  type AdminUserDetail,
  type AdminUserRoleName,
} from "../api/adminUsers";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  formatAdminUserDateTime,
  formatAdminUserProfileTypeLabel,
  formatAdminUserStatusLabel,
  getAdminUserStatusStyles,
} from "../utils/adminUsers";
import {
  getExactDigitsFieldError,
  getRejectedDigitsOnlyInputError,
  getRejectedTextOnlyInputError,
  getTextOnlyFieldError,
  sanitizeDigitsOnlyInput,
  sanitizeTextOnlyInput,
} from "../utils/identityValidation";
import { formatRoleLabels, getRoleLabel } from "../utils/roleLabels";

interface FormState {
  name: string;
  lastName: string;
  identificationNumber: string;
  phone: string;
  email: string;
}

const emptyForm: FormState = {
  name: "",
  lastName: "",
  identificationNumber: "",
  phone: "",
  email: "",
};

function toFormState(detail: AdminUserDetail): FormState {
  return {
    name: detail.name ?? "",
    lastName: detail.lastName ?? "",
    identificationNumber: detail.identificationNumber ?? "",
    phone: detail.phone ?? "",
    email: detail.email,
  };
}

function getOrderedRoleSelection(allowedRoleNames: AdminUserRoleName[], roleNames: AdminUserRoleName[]) {
  return allowedRoleNames.filter((roleName) => roleNames.includes(roleName));
}

function hasSameRoles(left: AdminUserRoleName[], right: AdminUserRoleName[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export default function AdminUserDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [selectedRoleNames, setSelectedRoleNames] = useState<AdminUserRoleName[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nameInputError, setNameInputError] = useState("");
  const [lastNameInputError, setLastNameInputError] = useState("");
  const [identificationNumberInputError, setIdentificationNumberInputError] = useState("");
  const [phoneInputError, setPhoneInputError] = useState("");
  const listPath = `/admin/users${location.search}`;

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
  const displayedNameError = nameInputError || (formState.name.length > 0 ? nameError : "");
  const displayedLastNameError = lastNameInputError || (formState.lastName.length > 0 ? lastNameError : "");
  const displayedIdentificationNumberError =
    identificationNumberInputError || (formState.identificationNumber.length > 0 ? identificationNumberError : "");
  const displayedPhoneError = phoneInputError || (formState.phone.length > 0 ? phoneError : "");

  const canSaveIdentity = useMemo(
    () =>
      !isSaving &&
      !displayedNameError &&
      !displayedLastNameError &&
      !displayedIdentificationNumberError &&
      !displayedPhoneError &&
      formState.email.trim().length > 0,
    [
      displayedIdentificationNumberError,
      displayedLastNameError,
      displayedNameError,
      displayedPhoneError,
      formState.email,
      isSaving,
    ],
  );

  const canSaveRoles = useMemo(() => {
    if (!detail || isSaving || selectedRoleNames.length === 0) {
      return false;
    }

    return !hasSameRoles(selectedRoleNames, getOrderedRoleSelection(detail.allowedRoleNames, detail.roleNames));
  }, [detail, isSaving, selectedRoleNames]);

  const applyDetail = (nextDetail: AdminUserDetail) => {
    setDetail(nextDetail);
    setFormState(toFormState(nextDetail));
    setSelectedRoleNames(getOrderedRoleSelection(nextDetail.allowedRoleNames, nextDetail.roleNames));
  };

  const loadDetail = async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAdminUserDetail(id);
      applyDetail(response);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar el detalle de la cuenta.");
      setDetail(null);
      setFormState(emptyForm);
      setSelectedRoleNames([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [id]);

  const handleChange = (field: keyof FormState, value: string) => {
    const nextValue = field === "name" || field === "lastName"
      ? sanitizeTextOnlyInput(value)
      : field === "identificationNumber"
        ? sanitizeDigitsOnlyInput(value, 11)
        : field === "phone"
          ? sanitizeDigitsOnlyInput(value, 10)
          : value;

    setFormState((current) => ({
      ...current,
      [field]: nextValue,
    }));

    if (field === "name") {
      setNameInputError(getRejectedTextOnlyInputError(value, "El nombre"));
    }

    if (field === "lastName") {
      setLastNameInputError(getRejectedTextOnlyInputError(value, "El apellido"));
    }

    if (field === "identificationNumber") {
      setIdentificationNumberInputError(getRejectedDigitsOnlyInputError(value, "La cedula", 11));
    }

    if (field === "phone") {
      setPhoneInputError(getRejectedDigitsOnlyInputError(value, "El telefono", 10));
    }
  };

  const handleSaveIdentity = async () => {
    if (!id || !canSaveIdentity) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await updateAdminUser(id, {
        name: formState.name,
        lastName: formState.lastName,
        identificationNumber: formState.identificationNumber,
        phone: formState.phone,
        email: formState.email.trim(),
      });
      applyDetail(response);
      setSuccessMessage("La informacion de la cuenta se actualizo correctamente.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible actualizar la cuenta.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleToggle = (roleName: AdminUserRoleName, checked: boolean) => {
    setSelectedRoleNames((current) => {
      const next = checked
        ? [...current, roleName]
        : current.filter((item) => item !== roleName);

      return detail ? getOrderedRoleSelection(detail.allowedRoleNames, next) : next;
    });
  };

  const handleSaveRoles = async () => {
    if (!id || !canSaveRoles) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await updateAdminUserRoles(id, selectedRoleNames);
      applyDetail(response);
      setSuccessMessage("Los roles permitidos se actualizaron correctamente.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible actualizar los roles.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActiveState = async () => {
    if (!id || !detail) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await updateAdminUserActiveState(id, !detail.isActive);
      applyDetail(response);
      setSuccessMessage(
        response.isActive
          ? "La cuenta se activo correctamente."
          : "La cuenta se desactivo y se cerraron las sesiones activas.",
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible actualizar el estado de la cuenta.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvalidateSessions = async () => {
    if (!id) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await invalidateAdminUserSessions(id);
      setSuccessMessage(
        result.revokedActiveSessionCount > 0
          ? `Se invalidaron ${result.revokedActiveSessionCount} sesiones activas.`
          : "La cuenta no tenia sesiones activas por invalidar.",
      );
      await loadDetail();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible invalidar las sesiones activas.");
    } finally {
      setIsSaving(false);
    }
  };

  const statusStyles = detail ? getAdminUserStatusStyles(detail.accountStatus) : null;

  return (
    <AdminPortalShell
      eyebrow="Detalle de usuario"
      title={detail?.displayName ?? "Cuenta administrativa"}
      description="Revisa la informacion de identidad, el estado de onboarding, los roles permitidos y las acciones de acceso de una cuenta desde una sola vista administrativa."
      actions={
        <>
          <Button variant="outlined" onClick={() => navigate(listPath)}>
            Volver al listado
          </Button>
          <Button variant="contained" onClick={() => void loadDetail()} disabled={isLoading || isSaving}>
            Actualizar detalle
          </Button>
        </>
      }
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        {isLoading && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1.1fr 0.9fr" },
              gap: 3,
            }}
          >
            <Stack spacing={3}>
              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Skeleton variant="text" width="36%" />
                <Skeleton variant="text" width="68%" />
                <Skeleton variant="rounded" height={136} sx={{ mt: 2 }} />
              </Paper>
              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Skeleton variant="rounded" height={212} />
              </Paper>
            </Stack>
            <Stack spacing={3}>
              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Skeleton variant="rounded" height={180} />
              </Paper>
              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Skeleton variant="rounded" height={140} />
              </Paper>
            </Stack>
          </Box>
        )}

        {!isLoading && !detail && (
          <Alert severity="info" variant="outlined">
            No fue posible cargar la cuenta solicitada.
          </Alert>
        )}

        {!isLoading && detail && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "1.1fr 0.9fr" },
              gap: 3,
            }}
          >
            <Stack spacing={3}>
              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Stack spacing={2.2}>
                  <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", lg: "center" }}
                  >
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {statusStyles && (
                        <Chip
                          label={formatAdminUserStatusLabel(detail.accountStatus)}
                          sx={{
                            bgcolor: statusStyles.bg,
                            color: statusStyles.color,
                            fontWeight: 700,
                          }}
                        />
                      )}
                      <Chip
                        label={formatAdminUserProfileTypeLabel(detail.profileType)}
                        sx={{
                          bgcolor: "rgba(59, 108, 141, 0.12)",
                          color: "#214e67",
                          fontWeight: 700,
                        }}
                      />
                      {detail.requiresManualIntervention && (
                        <Chip
                          label="Intervencion manual"
                          sx={{
                            bgcolor: "rgba(183, 79, 77, 0.12)",
                            color: "#8b3635",
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>

                    <Typography color="text.secondary">Cuenta {detail.id}</Typography>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                      gap: 1.8,
                    }}
                  >
                    {[
                      ["Correo", detail.email],
                      ["Cedula", detail.identificationNumber ?? "Sin cedula"],
                      ["Telefono", detail.phone ?? "Sin telefono"],
                      ["Roles actuales", formatRoleLabels(detail.roleNames)],
                      ["Roles permitidos", formatRoleLabels(detail.allowedRoleNames)],
                      ["Sesiones activas", String(detail.activeRefreshTokenCount)],
                      ["Creada", formatAdminUserDateTime(detail.createdAtUtc)],
                      ["Historial operativo", detail.hasOperationalHistory ? "Si" : "No"],
                    ].map(([label, value]) => (
                      <Box key={label}>
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          {label}
                        </Typography>
                        <Typography sx={{ mt: 0.45 }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {detail.requiresProfileCompletion && <Chip label="Perfil incompleto" variant="outlined" />}
                    {detail.requiresAdminReview && <Chip label="Requiere revision administrativa" variant="outlined" />}
                    {!detail.requiresProfileCompletion && !detail.requiresAdminReview && !detail.requiresManualIntervention && (
                      <Chip label="Onboarding operativo al dia" variant="outlined" />
                    )}
                  </Stack>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Stack spacing={2.2}>
                  <Box>
                    <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                      Editar informacion de la cuenta
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.8, lineHeight: 1.7 }}>
                      El tipo de perfil es fijo despues de la creacion. Aqui solo se actualizan los datos de identidad permitidos por la politica actual.
                    </Typography>
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
                      error={Boolean(displayedNameError)}
                      helperText={displayedNameError || " "}
                    />
                    <TextField
                      label="Apellido"
                      value={formState.lastName}
                      onChange={(event) => handleChange("lastName", event.target.value)}
                      error={Boolean(displayedLastNameError)}
                      helperText={displayedLastNameError || " "}
                    />
                    <TextField
                      label="Cedula"
                      value={formState.identificationNumber}
                      onChange={(event) => handleChange("identificationNumber", event.target.value)}
                      error={Boolean(displayedIdentificationNumberError)}
                      helperText={displayedIdentificationNumberError || " "}
                    />
                    <TextField
                      label="Telefono"
                      value={formState.phone}
                      onChange={(event) => handleChange("phone", event.target.value)}
                      error={Boolean(displayedPhoneError)}
                      helperText={displayedPhoneError || " "}
                    />
                    <TextField
                      label="Correo"
                      type="email"
                      value={formState.email}
                      onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                      helperText=" "
                    />
                  </Box>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                    <Button variant="contained" onClick={handleSaveIdentity} disabled={!canSaveIdentity}>
                      Guardar informacion
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  Perfil relacionado
                </Typography>

                {detail.nurseProfile && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                      gap: 1.8,
                      mt: 2.2,
                    }}
                  >
                    {[
                      ["Estado del perfil", detail.nurseProfile.isActive ? "Activo" : "Pendiente"],
                      ["Fecha de contratacion", detail.nurseProfile.hireDate ?? "Sin fecha"],
                      ["Especialidad", detail.nurseProfile.specialty ?? "Sin especialidad"],
                      ["Licencia", detail.nurseProfile.licenseId ?? "Sin licencia"],
                      ["Banco", detail.nurseProfile.bankName ?? "Sin banco"],
                      ["Cuenta", detail.nurseProfile.accountNumber ?? "Sin cuenta"],
                      ["Categoria", detail.nurseProfile.category ?? "Sin categoria"],
                      ["Solicitudes asignadas", String(detail.nurseProfile.assignedCareRequestsCount)],
                    ].map(([label, value]) => (
                      <Paper
                        key={label}
                        sx={{
                          p: 2.2,
                          borderRadius: 2.5,
                          bgcolor: "rgba(247, 244, 238, 0.72)",
                          boxShadow: "none",
                        }}
                      >
                        <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                          {label}
                        </Typography>
                        <Typography sx={{ mt: 0.65, fontWeight: 700 }}>{value}</Typography>
                      </Paper>
                    ))}
                  </Box>
                )}

                {detail.clientProfile && (
                  <Box sx={{ mt: 2.2 }}>
                    <Paper
                      sx={{
                        p: 2.2,
                        borderRadius: 2.5,
                        bgcolor: "rgba(247, 244, 238, 0.72)",
                        boxShadow: "none",
                        maxWidth: 360,
                      }}
                    >
                      <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                        Solicitudes creadas
                      </Typography>
                      <Typography sx={{ mt: 0.65, fontWeight: 700 }}>
                        {detail.clientProfile.ownedCareRequestsCount}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Paper>
            </Stack>

            <Stack spacing={3}>
              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Stack spacing={2.2}>
                  <Box>
                    <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                      Gestion de roles
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.8, lineHeight: 1.7 }}>
                      Solo se muestran roles compatibles con este tipo de perfil. Los codigos internos no se exponen en la interfaz administrativa.
                    </Typography>
                  </Box>

                  <FormGroup>
                    {detail.allowedRoleNames.map((roleName) => (
                      <FormControlLabel
                        key={roleName}
                        control={(
                          <Checkbox
                            checked={selectedRoleNames.includes(roleName)}
                            onChange={(event) => handleRoleToggle(roleName, event.target.checked)}
                          />
                        )}
                        label={getRoleLabel(roleName)}
                      />
                    ))}
                  </FormGroup>

                  <Button variant="contained" onClick={handleSaveRoles} disabled={!canSaveRoles}>
                    Guardar roles
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Stack spacing={2.2}>
                  <Box>
                    <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                      Estado de acceso
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.8, lineHeight: 1.7 }}>
                      Las cuentas con historial operativo se conservan para auditoria. Se desactivan o archivan, pero no se eliminan fisicamente.
                    </Typography>
                  </Box>

                  <Typography sx={{ fontWeight: 700 }}>
                    Estado actual: {detail.isActive ? "Activa" : "Inactiva"}
                  </Typography>

                  <Button
                    variant="outlined"
                    color={detail.isActive ? "warning" : "success"}
                    onClick={handleToggleActiveState}
                    disabled={isSaving}
                  >
                    {detail.isActive ? "Desactivar cuenta" : "Activar cuenta"}
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
                <Stack spacing={2.2}>
                  <Box>
                    <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                      Sesiones y tokens
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.8, lineHeight: 1.7 }}>
                      Usa esta accion cuando debas cerrar sesiones activas o invalidar tokens de actualizacion por seguridad o soporte.
                    </Typography>
                  </Box>

                  <Typography sx={{ fontWeight: 700 }}>
                    Sesiones activas registradas: {detail.activeRefreshTokenCount}
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={handleInvalidateSessions}
                    disabled={isSaving}
                  >
                    Invalidar sesiones activas
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        )}
      </Stack>
    </AdminPortalShell>
  );
}

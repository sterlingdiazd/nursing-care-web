import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { createAdminAccount, type AdminUserDetail } from "../api/adminUsers";
import { validateEmail, validatePassword } from "../api/auth";
import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  getExactDigitsFieldError,
  getRejectedDigitsOnlyInputError,
  getRejectedTextOnlyInputError,
  getTextOnlyFieldError,
  sanitizeDigitsOnlyInput,
  sanitizeTextOnlyInput,
} from "../utils/identityValidation";
import { getRoleLabel } from "../utils/roleLabels";

interface FormState {
  name: string;
  lastName: string;
  identificationNumber: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const emptyForm: FormState = {
  name: "",
  lastName: "",
  identificationNumber: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AdminCreateAdminPage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [nameInputError, setNameInputError] = useState("");
  const [lastNameInputError, setLastNameInputError] = useState("");
  const [identificationNumberInputError, setIdentificationNumberInputError] = useState("");
  const [phoneInputError, setPhoneInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdAccount, setCreatedAccount] = useState<AdminUserDetail | null>(null);

  const passwordValidation = useMemo(() => validatePassword(formState.password), [formState.password]);
  const isEmailValid = validateEmail(formState.email.trim());
  const passwordsMatch = formState.confirmPassword.length > 0 && formState.password === formState.confirmPassword;
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
  const emailError = formState.email.length === 0
    ? ""
    : isEmailValid
      ? ""
      : "Ingresa un correo valido.";
  const confirmPasswordError = formState.confirmPassword.length === 0
    ? ""
    : passwordsMatch
      ? ""
      : "Las contrasenas deben coincidir.";

  const canSubmit = !isSubmitting
    && !displayedNameError
    && !displayedLastNameError
    && !displayedIdentificationNumberError
    && !displayedPhoneError
    && !emailError
    && passwordValidation.isValid
    && !confirmPasswordError
    && formState.name.trim().length > 0
    && formState.lastName.trim().length > 0
    && formState.identificationNumber.trim().length === 11
    && formState.phone.trim().length === 10
    && formState.email.trim().length > 0
    && formState.password.length > 0
    && formState.confirmPassword.length > 0;

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

  const resetForm = () => {
    setFormState(emptyForm);
    setNameInputError("");
    setLastNameInputError("");
    setIdentificationNumberInputError("");
    setPhoneInputError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!canSubmit) {
      setError("Completa los campos requeridos y corrige las validaciones antes de crear la cuenta.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createAdminAccount({
        name: formState.name.trim(),
        lastName: formState.lastName.trim(),
        identificationNumber: formState.identificationNumber.trim(),
        phone: formState.phone.trim(),
        email: formState.email.trim(),
        password: formState.password,
        confirmPassword: formState.confirmPassword,
      });

      setCreatedAccount(response);
      setSuccessMessage("La cuenta administrativa se creo correctamente y la accion quedo registrada en auditoria.");
      resetForm();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible crear la cuenta administrativa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminPortalShell
      eyebrow="Usuarios y acceso"
      title="Crea nuevas cuentas administrativas desde un flujo interno y controlado."
      description="Esta ruta formaliza la creacion de administracion dentro del portal. La cuenta nace activa, con validaciones de identidad consistentes y registro auditable del actor que ejecuta la accion."
      actions={(
        <Button variant="outlined" onClick={() => navigate("/admin/users")}>
          Volver a usuarios
        </Button>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Paper sx={{ p: 3, borderRadius: 3.5 }}>
          <Stack spacing={1.2}>
            <Typography variant="h5">
              Flujo soportado en esta entrega
            </Typography>
            <Typography color="text.secondary">
              La plataforma crea la cuenta con contrasena inicial definida por administracion y perfil base de cliente con acceso administrativo.
            </Typography>
            <Typography color="text.secondary">
              La invitacion por correo se deja fuera de esta entrega hasta contar con un flujo formal de activacion y restablecimiento de contrasena.
            </Typography>
            <Typography color="text.secondary">
              El antiguo <code>setup-admin</code> queda reservado para instalacion inicial y ya no debe usarse como mecanismo operativo cotidiano.
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3.5 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.25}>
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
                  error={!!displayedNameError}
                  helperText={displayedNameError || "Campo obligatorio. Solo letras y espacios."}
                  disabled={isSubmitting}
                />
                <TextField
                  label="Apellido"
                  value={formState.lastName}
                  onChange={(event) => handleChange("lastName", event.target.value)}
                  error={!!displayedLastNameError}
                  helperText={displayedLastNameError || "Campo obligatorio. Solo letras y espacios."}
                  disabled={isSubmitting}
                />
                <TextField
                  label="Cedula"
                  value={formState.identificationNumber}
                  onChange={(event) => handleChange("identificationNumber", event.target.value)}
                  error={!!displayedIdentificationNumberError}
                  helperText={displayedIdentificationNumberError || "Debe tener exactamente 11 digitos."}
                  inputProps={{ inputMode: "numeric", pattern: "\\d*", maxLength: 11 }}
                  disabled={isSubmitting}
                />
                <TextField
                  label="Telefono"
                  value={formState.phone}
                  onChange={(event) => handleChange("phone", event.target.value)}
                  error={!!displayedPhoneError}
                  helperText={displayedPhoneError || "Debe tener exactamente 10 digitos."}
                  inputProps={{ inputMode: "numeric", pattern: "\\d*", maxLength: 10 }}
                  disabled={isSubmitting}
                />
              </Box>

              <TextField
                fullWidth
                label="Correo institucional"
                type="email"
                value={formState.email}
                onChange={(event) => handleChange("email", event.target.value)}
                error={!!emailError}
                helperText={emailError || "Usa el correo que identificara la nueva cuenta administrativa."}
                disabled={isSubmitting}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Contrasena inicial"
                  type="password"
                  value={formState.password}
                  onChange={(event) => handleChange("password", event.target.value)}
                  error={formState.password.length > 0 && !passwordValidation.isValid}
                  helperText={
                    formState.password.length > 0
                      ? passwordValidation.message
                      : "Debe tener al menos 6 caracteres."
                  }
                  disabled={isSubmitting}
                />
                <TextField
                  label="Confirmar contrasena"
                  type="password"
                  value={formState.confirmPassword}
                  onChange={(event) => handleChange("confirmPassword", event.target.value)}
                  error={!!confirmPasswordError}
                  helperText={confirmPasswordError || "Repite la contrasena exactamente igual."}
                  disabled={isSubmitting}
                />
              </Box>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <Button type="submit" variant="contained" disabled={!canSubmit}>
                  Crear cuenta administrativa
                </Button>
                <Button
                  type="button"
                  variant="text"
                  disabled={isSubmitting}
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    resetForm();
                  }}
                >
                  Limpiar formulario
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>

        {createdAccount && (
          <Paper sx={{ p: 3, borderRadius: 3.5 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ xs: "flex-start", md: "center" }}>
                <Typography variant="h5">
                  Cuenta creada
                </Typography>
                <Chip label={getRoleLabel("ADMIN")} color="primary" />
              </Stack>

              <Typography color="text.secondary">
                {createdAccount.displayName} quedó habilitado en el portal con el correo {createdAccount.email}.
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <Button variant="contained" onClick={() => navigate(`/admin/users/${createdAccount.id}`)}>
                  Ver cuenta creada
                </Button>
                <Button variant="outlined" onClick={() => navigate("/admin/users")}>
                  Volver al listado
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </AdminPortalShell>
  );
}

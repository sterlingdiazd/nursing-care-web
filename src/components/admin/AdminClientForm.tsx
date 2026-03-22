import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { validateEmail, validatePassword } from "../../api/auth";
import {
  getExactDigitsFieldError,
  getRejectedDigitsOnlyInputError,
  getRejectedTextOnlyInputError,
  getTextOnlyFieldError,
  sanitizeDigitsOnlyInput,
  sanitizeTextOnlyInput,
} from "../../utils/identityValidation";

export interface AdminClientFormValues {
  name: string;
  lastName: string;
  identificationNumber: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AdminClientFormProps {
  mode: "create" | "edit";
  initialValues: AdminClientFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: AdminClientFormValues) => void;
  onCancel: () => void;
  cancelLabel?: string;
  helperText?: string;
}

export const emptyAdminClientFormValues: AdminClientFormValues = {
  name: "",
  lastName: "",
  identificationNumber: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AdminClientForm({
  mode,
  initialValues,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
  cancelLabel = "Cancelar",
  helperText,
}: AdminClientFormProps) {
  const [formState, setFormState] = useState<AdminClientFormValues>(initialValues);
  const [nameInputError, setNameInputError] = useState("");
  const [lastNameInputError, setLastNameInputError] = useState("");
  const [identificationNumberInputError, setIdentificationNumberInputError] = useState("");
  const [phoneInputError, setPhoneInputError] = useState("");

  const isCreateMode = mode === "create";
  const passwordValidation = useMemo(() => validatePassword(formState.password), [formState.password]);
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
  const emailError = formState.email.trim().length === 0
    ? ""
    : validateEmail(formState.email.trim())
      ? ""
      : "Ingresa un correo valido.";
  const confirmPasswordError = !isCreateMode || formState.confirmPassword.length === 0
    ? ""
    : formState.password === formState.confirmPassword
      ? ""
      : "Las contrasenas deben coincidir.";
  const displayedNameError = nameInputError || (formState.name.length > 0 ? nameError : "");
  const displayedLastNameError = lastNameInputError || (formState.lastName.length > 0 ? lastNameError : "");
  const displayedIdentificationNumberError =
    identificationNumberInputError || (formState.identificationNumber.length > 0 ? identificationNumberError : "");
  const displayedPhoneError = phoneInputError || (formState.phone.length > 0 ? phoneError : "");

  const canSubmit = !isSubmitting
    && !displayedNameError
    && !displayedLastNameError
    && !displayedIdentificationNumberError
    && !displayedPhoneError
    && !emailError
    && formState.name.trim().length > 0
    && formState.lastName.trim().length > 0
    && formState.identificationNumber.trim().length === 11
    && formState.phone.trim().length === 10
    && formState.email.trim().length > 0
    && (!isCreateMode || (
      formState.password.length > 0
      && formState.confirmPassword.length > 0
      && passwordValidation.isValid
      && !confirmPasswordError
    ));

  useEffect(() => {
    setFormState(initialValues);
    setNameInputError("");
    setLastNameInputError("");
    setIdentificationNumberInputError("");
    setPhoneInputError("");
  }, [initialValues]);

  const handleChange = (field: keyof AdminClientFormValues, value: string) => {
    const nextValue = field === "name" || field === "lastName"
      ? sanitizeTextOnlyInput(value)
      : field === "identificationNumber"
        ? sanitizeDigitsOnlyInput(value, 11)
        : field === "phone"
          ? sanitizeDigitsOnlyInput(value, 10)
          : value;

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

    setFormState((current) => ({
      ...current,
      [field]: nextValue,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit({
      ...formState,
      name: formState.name.trim(),
      lastName: formState.lastName.trim(),
      identificationNumber: formState.identificationNumber.trim(),
      phone: formState.phone.trim(),
      email: formState.email.trim(),
      password: formState.password,
      confirmPassword: formState.confirmPassword,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2.25}>
        {helperText && (
          <Paper sx={{ p: 2.4, borderRadius: 3, bgcolor: "rgba(247, 244, 238, 0.78)", boxShadow: "none" }}>
            <Typography color="text.secondary">{helperText}</Typography>
          </Paper>
        )}

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
          label="Correo del cliente"
          type="email"
          value={formState.email}
          onChange={(event) => handleChange("email", event.target.value)}
          error={!!emailError}
          helperText={emailError || "Usa un correo vigente para acceso y recuperacion futura."}
          disabled={isSubmitting}
        />

        {isCreateMode && (
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
              helperText={formState.password.length > 0 && !passwordValidation.isValid
                ? passwordValidation.error
                : "Minimo 6 caracteres."}
              disabled={isSubmitting}
            />
            <TextField
              label="Confirmar contrasena"
              type="password"
              value={formState.confirmPassword}
              onChange={(event) => handleChange("confirmPassword", event.target.value)}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError || "Repite la contrasena para confirmar."}
              disabled={isSubmitting}
            />
          </Box>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Button type="submit" variant="contained" disabled={!canSubmit}>
            {submitLabel}
          </Button>
          <Button type="button" variant="text" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

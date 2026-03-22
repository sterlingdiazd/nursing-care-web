import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { validateEmail, validatePassword } from "../../api/auth";
import { nurseCategories, nurseSpecialties } from "../../constants/nurseProfileOptions";
import {
  getExactDigitsFieldError,
  getOptionalDigitsFieldError,
  getRejectedDigitsOnlyInputError,
  getRejectedTextOnlyInputError,
  getTextOnlyFieldError,
  sanitizeDigitsOnlyInput,
  sanitizeTextOnlyInput,
} from "../../utils/identityValidation";

export interface NurseProfileFormValues {
  name: string;
  lastName: string;
  identificationNumber: string;
  phone: string;
  email: string;
  hireDate: string;
  specialty: string;
  licenseId: string;
  bankName: string;
  accountNumber: string;
  category: string;
  password: string;
  confirmPassword: string;
  isOperationallyActive: boolean;
}

interface AdminNurseProfileFormProps {
  mode: "create" | "edit" | "review";
  initialValues: NurseProfileFormValues;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: NurseProfileFormValues) => void;
  onCancel: () => void;
  cancelLabel?: string;
  helperText?: string;
}

export const emptyNurseProfileFormValues: NurseProfileFormValues = {
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
  password: "",
  confirmPassword: "",
  isOperationallyActive: true,
};

export default function AdminNurseProfileForm({
  mode,
  initialValues,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
  cancelLabel = "Cancelar",
  helperText,
}: AdminNurseProfileFormProps) {
  const [formState, setFormState] = useState<NurseProfileFormValues>(initialValues);
  const [nameInputError, setNameInputError] = useState("");
  const [lastNameInputError, setLastNameInputError] = useState("");
  const [identificationNumberInputError, setIdentificationNumberInputError] = useState("");
  const [phoneInputError, setPhoneInputError] = useState("");
  const [licenseIdInputError, setLicenseIdInputError] = useState("");
  const [bankNameInputError, setBankNameInputError] = useState("");
  const [accountNumberInputError, setAccountNumberInputError] = useState("");

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
  const bankNameError = useMemo(() => getTextOnlyFieldError(formState.bankName, "El banco"), [formState.bankName]);
  const licenseIdError = useMemo(
    () => getOptionalDigitsFieldError(formState.licenseId, "La licencia"),
    [formState.licenseId],
  );
  const accountNumberError = useMemo(
    () => getOptionalDigitsFieldError(formState.accountNumber, "El numero de cuenta"),
    [formState.accountNumber],
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
  const displayedLicenseIdError = licenseIdInputError || (formState.licenseId.length > 0 ? licenseIdError : "");
  const displayedBankNameError = bankNameInputError || (formState.bankName.length > 0 ? bankNameError : "");
  const displayedAccountNumberError =
    accountNumberInputError || (formState.accountNumber.length > 0 ? accountNumberError : "");

  const canSubmit = !isSubmitting
    && !displayedNameError
    && !displayedLastNameError
    && !displayedIdentificationNumberError
    && !displayedPhoneError
    && !displayedLicenseIdError
    && !displayedBankNameError
    && !displayedAccountNumberError
    && !emailError
    && formState.name.trim().length > 0
    && formState.lastName.trim().length > 0
    && formState.identificationNumber.trim().length === 11
    && formState.phone.trim().length === 10
    && formState.email.trim().length > 0
    && formState.hireDate.trim().length > 0
    && formState.specialty.trim().length > 0
    && formState.bankName.trim().length > 0
    && formState.category.trim().length > 0
    && (!isCreateMode || (passwordValidation.isValid && !confirmPasswordError));

  useEffect(() => {
    setFormState(initialValues);
    setNameInputError("");
    setLastNameInputError("");
    setIdentificationNumberInputError("");
    setPhoneInputError("");
    setLicenseIdInputError("");
    setBankNameInputError("");
    setAccountNumberInputError("");
  }, [initialValues]);

  const handleChange = (field: keyof NurseProfileFormValues, value: string | boolean) => {
    if (typeof value === "boolean") {
      setFormState((current) => ({ ...current, [field]: value }));
      return;
    }

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
      hireDate: formState.hireDate.trim(),
      specialty: formState.specialty.trim(),
      licenseId: formState.licenseId.trim(),
      bankName: formState.bankName.trim(),
      accountNumber: formState.accountNumber.trim(),
      category: formState.category.trim(),
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
          label="Correo"
          type="email"
          value={formState.email}
          onChange={(event) => handleChange("email", event.target.value)}
          error={!!emailError}
          helperText={emailError || "Este correo identificara el acceso del perfil."}
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
            label="Fecha de contratacion"
            type="date"
            value={formState.hireDate}
            onChange={(event) => handleChange("hireDate", event.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={isSubmitting}
          />
          <TextField
            select
            label="Especialidad"
            value={formState.specialty}
            onChange={(event) => handleChange("specialty", event.target.value)}
            SelectProps={{ native: true }}
            disabled={isSubmitting}
          >
            <option value="">Selecciona una especialidad</option>
            {nurseSpecialties.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TextField>
          <TextField
            label="Licencia"
            value={formState.licenseId}
            onChange={(event) => handleChange("licenseId", event.target.value)}
            error={!!displayedLicenseIdError}
            helperText={displayedLicenseIdError || "Opcional. Solo digitos."}
            inputProps={{ inputMode: "numeric", pattern: "\\d*" }}
            disabled={isSubmitting}
          />
          <TextField
            label="Banco"
            value={formState.bankName}
            onChange={(event) => handleChange("bankName", event.target.value)}
            error={!!displayedBankNameError}
            helperText={displayedBankNameError || "Campo obligatorio. Solo letras y espacios."}
            disabled={isSubmitting}
          />
          <TextField
            label="Numero de cuenta"
            value={formState.accountNumber}
            onChange={(event) => handleChange("accountNumber", event.target.value)}
            error={!!displayedAccountNumberError}
            helperText={displayedAccountNumberError || "Opcional. Solo digitos."}
            inputProps={{ inputMode: "numeric", pattern: "\\d*" }}
            disabled={isSubmitting}
          />
          <TextField
            select
            label="Categoria"
            value={formState.category}
            onChange={(event) => handleChange("category", event.target.value)}
            SelectProps={{ native: true }}
            disabled={isSubmitting}
          >
            <option value="">Selecciona una categoria</option>
            {nurseCategories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TextField>
        </Box>

        {isCreateMode && (
          <>
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

            <FormControlLabel
              control={(
                <Switch
                  checked={formState.isOperationallyActive}
                  onChange={(event) => handleChange("isOperationallyActive", event.target.checked)}
                  disabled={isSubmitting}
                />
              )}
              label="Crear con acceso operativo activo"
            />
          </>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <Button type="submit" variant="contained" disabled={!canSubmit}>
            {submitLabel}
          </Button>
          <Button type="button" variant="text" disabled={isSubmitting} onClick={onCancel}>
            {cancelLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

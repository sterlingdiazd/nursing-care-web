import React, { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { getGoogleOAuthStartUrl, validateEmail, validatePassword } from "../api/auth";
import AuthScene from "../components/layout/AuthScene";
import { useAuth } from "../context/AuthContext";
import { RegisterRequest, UserProfileType } from "../types/auth";
import {
  getExactDigitsFieldError,
  getOptionalDigitsFieldError,
  getRejectedDigitsOnlyInputError,
  getRejectedTextOnlyInputError,
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

const clientProfileCopy =
  "Perfil de cliente seleccionado. No hay campos adicionales por completar en esta etapa y el acceso operativo queda disponible cuando termine el registro.";

const nurseProfileCopy =
  "Perfil de enfermeria seleccionado. Podras iniciar sesion al terminar el registro, pero el panel quedara en revision administrativa hasta que completen tu perfil.";

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    completeProfile,
    isLoading,
    email: authEmail,
    isAuthenticated,
    requiresProfileCompletion,
  } = useAuth();
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileType, setProfileType] = useState<UserProfileType>(UserProfileType.Client);
  const [hireDate, setHireDate] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [nameInputError, setNameInputError] = useState("");
  const [lastNameInputError, setLastNameInputError] = useState("");
  const [identificationNumberInputError, setIdentificationNumberInputError] = useState("");
  const [phoneInputError, setPhoneInputError] = useState("");
  const [licenseIdInputError, setLicenseIdInputError] = useState("");
  const [bankNameInputError, setBankNameInputError] = useState("");
  const [accountNumberInputError, setAccountNumberInputError] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isProfileCompletionMode = isAuthenticated && requiresProfileCompletion;
  const isNurseRegistration = !isProfileCompletionMode && profileType === UserProfileType.Nurse;
  const effectiveEmail = isProfileCompletionMode ? authEmail ?? "" : email;

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const isEmailValid = validateEmail(effectiveEmail.trim());
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const nameError = useMemo(() => getTextOnlyFieldError(name, "El nombre"), [name]);
  const lastNameError = useMemo(() => getTextOnlyFieldError(lastName, "El apellido"), [lastName]);
  const identificationNumberError = useMemo(
    () => getExactDigitsFieldError(identificationNumber, "La cedula", 11),
    [identificationNumber],
  );
  const phoneError = useMemo(() => getExactDigitsFieldError(phone, "El telefono", 10), [phone]);
  const licenseIdError = useMemo(() => getOptionalDigitsFieldError(licenseId, "La licencia"), [licenseId]);
  const bankNameError = useMemo(() => getTextOnlyFieldError(bankName, "El banco", isNurseRegistration), [bankName, isNurseRegistration]);
  const accountNumberError = useMemo(
    () => getOptionalDigitsFieldError(accountNumber, "El numero de cuenta"),
    [accountNumber],
  );
  const displayedNameError = nameInputError || (name.length > 0 ? nameError : "");
  const displayedLastNameError = lastNameInputError || (lastName.length > 0 ? lastNameError : "");
  const displayedIdentificationNumberError =
    identificationNumberInputError || (identificationNumber.length > 0 ? identificationNumberError : "");
  const displayedPhoneError = phoneInputError || (phone.length > 0 ? phoneError : "");
  const displayedLicenseIdError = licenseIdInputError || (licenseId.length > 0 ? licenseIdError : "");
  const displayedBankNameError = bankNameInputError || (bankName.length > 0 ? bankNameError : "");
  const displayedAccountNumberError =
    accountNumberInputError || (accountNumber.length > 0 ? accountNumberError : "");
  const canSubmit =
    !isLoading &&
    !displayedNameError &&
    !displayedLastNameError &&
    !displayedIdentificationNumberError &&
    !displayedPhoneError &&
    isEmailValid &&
    (isProfileCompletionMode ||
      (email.trim().length > 0 &&
        password.length > 0 &&
        confirmPassword.length > 0 &&
        passwordValidation.isValid &&
        passwordsMatch &&
        (!isNurseRegistration ||
          (hireDate.trim().length > 0 &&
            specialty.trim().length > 0 &&
            !displayedLicenseIdError &&
            !displayedBankNameError &&
            !displayedAccountNumberError))));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!canSubmit) {
      setError("Completa los campos requeridos y corrige las validaciones antes de enviar.");
      return;
    }

    try {
      if (isProfileCompletionMode) {
        await completeProfile({
          name: name.trim(),
          lastName: lastName.trim(),
          identificationNumber: identificationNumber.trim(),
          phone: phone.trim(),
        });
        setSuccessMessage("Perfil completado. Ya puedes continuar al panel principal.");
        navigate("/home");
      } else {
        const payload: RegisterRequest = {
          name: name.trim(),
          lastName: lastName.trim(),
          identificationNumber: identificationNumber.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          hireDate: isNurseRegistration ? hireDate : null,
          specialty: isNurseRegistration ? specialty : null,
          licenseId: isNurseRegistration ? licenseId : null,
          bankName: isNurseRegistration ? bankName : null,
          accountNumber: isNurseRegistration ? accountNumber : null,
          profileType,
        };

        await register(payload);
        setSuccessMessage(
          profileType === UserProfileType.Nurse
            ? "Registro completado. Tu panel mostrara que administracion debe completar tu perfil de enfermeria antes de habilitar el acceso operativo."
            : "Registro completado. Tu cuenta ya entro al espacio autenticado."
        );
        navigate("/home");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible registrarte.");
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    setSuccessMessage(null);
    window.location.assign(getGoogleOAuthStartUrl());
  };

  return (
    <AuthScene
      eyebrow="Crear acceso"
      title={isProfileCompletionMode ? "Completa tu registro de NursingCare." : "Registra tu cuenta de NursingCare."}
      subtitle={isProfileCompletionMode
        ? "Tu cuenta de Google ya fue validada. Completa los datos restantes para habilitar el acceso a la aplicacion."
        : "Elige el rol que corresponde a tu uso del sistema. Las cuentas de cliente entran de inmediato al espacio autenticado; las de enfermeria reciben acceso autenticado, pero las acciones clinicas quedan bloqueadas hasta que administracion complete el perfil."}
      asideTitle="Complecion administrativa"
      asideBody="La cuenta de enfermeria puede iniciar sesion desde el registro, pero las acciones clinicas quedan bloqueadas hasta que administracion complete el perfil."
      form={
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            {error && <Alert severity="error">{error}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}

            <TextField
              fullWidth
              label="Nombre"
              value={name}
              onChange={(event) => {
                const nextValue = event.target.value;
                setName(sanitizeTextOnlyInput(nextValue));
                setNameInputError(getRejectedTextOnlyInputError(nextValue, "El nombre"));
              }}
              disabled={isLoading}
              error={!!displayedNameError}
              helperText={displayedNameError || "Campo obligatorio. Solo letras y espacios."}
            />

            <TextField
              fullWidth
              label="Apellido"
              value={lastName}
              onChange={(event) => {
                const nextValue = event.target.value;
                setLastName(sanitizeTextOnlyInput(nextValue));
                setLastNameInputError(getRejectedTextOnlyInputError(nextValue, "El apellido"));
              }}
              disabled={isLoading}
              error={!!displayedLastNameError}
              helperText={displayedLastNameError || "Campo obligatorio. Solo letras y espacios."}
            />

            <TextField
              fullWidth
              label="Cédula"
              value={identificationNumber}
              onChange={(event) => {
                const nextValue = event.target.value;
                setIdentificationNumber(sanitizeDigitsOnlyInput(nextValue, 11));
                setIdentificationNumberInputError(getRejectedDigitsOnlyInputError(nextValue, "La cedula", 11));
              }}
              disabled={isLoading}
              error={!!displayedIdentificationNumberError}
              helperText={displayedIdentificationNumberError || "Debe tener exactamente 11 digitos."}
              inputProps={{ inputMode: "numeric", pattern: "\\d*", maxLength: 11 }}
            />

            <TextField
              fullWidth
              label="Telefono"
              value={phone}
              onChange={(event) => {
                const nextValue = event.target.value;
                setPhone(sanitizeDigitsOnlyInput(nextValue, 10));
                setPhoneInputError(getRejectedDigitsOnlyInputError(nextValue, "El telefono", 10));
              }}
              disabled={isLoading}
              error={!!displayedPhoneError}
              helperText={displayedPhoneError || "Debe tener exactamente 10 digitos."}
              inputProps={{ inputMode: "numeric", pattern: "\\d*", maxLength: 10 }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={effectiveEmail}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@centro.org"
              disabled={isLoading || isProfileCompletionMode}
              error={effectiveEmail.length > 0 && !isEmailValid}
              helperText={
                effectiveEmail.length > 0 && !isEmailValid
                  ? "Use a valid email format."
                  : isProfileCompletionMode
                    ? "Este correo proviene de Google y no se puede modificar aqui."
                    : "Este correo sera tu usuario para futuros inicios de sesion."
              }
            />

            {!isProfileCompletionMode && (
              <>
                <TextField
                  fullWidth
                  label="Contrasena"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isLoading}
                  error={password.length > 0 && !passwordValidation.isValid}
                  helperText={password.length > 0 ? passwordValidation.message : "Minimo 6 caracteres"}
                />

                <TextField
                  fullWidth
                  label="Confirmar contrasena"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isLoading}
                  error={confirmPassword.length > 0 && !passwordsMatch}
                  helperText={
                    confirmPassword.length > 0 && !passwordsMatch
                      ? "Las contrasenas deben coincidir."
                      : "Repite la contrasena exactamente igual."
                  }
                />

                <FormControl>
                  <FormLabel sx={{ mb: 1, color: "text.primary" }}>Registrarse como</FormLabel>
                  <RadioGroup
                    value={String(profileType)}
                    onChange={(event) =>
                      setProfileType(Number(event.target.value) as UserProfileType)
                    }
                  >
                    <PaperOption
                      value={String(UserProfileType.Client)}
                      control={<Radio />}
                      label="Cliente"
                      description="Acceso inmediato despues del registro."
                    />
                    <PaperOption
                      value={String(UserProfileType.Nurse)}
                      control={<Radio />}
                      label="Enfermeria"
                      description="Inicia sesion de inmediato, pero espera la completacion administrativa del perfil."
                    />
                  </RadioGroup>
                </FormControl>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.25,
                    borderRadius: 2.5,
                    bgcolor:
                      profileType === UserProfileType.Nurse
                        ? "rgba(31, 75, 110, 0.04)"
                        : "rgba(44, 122, 100, 0.06)",
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {profileType === UserProfileType.Nurse ? "Perfil de enfermeria" : "Perfil de cliente"}
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {profileType === UserProfileType.Nurse ? nurseProfileCopy : clientProfileCopy}
                    </Typography>
                  </Stack>
                </Paper>

                {isNurseRegistration ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      bgcolor: "rgba(247, 244, 238, 0.72)",
                    }}
                  >
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        Datos del perfil de enfermeria
                      </Typography>

                      <TextField
                        fullWidth
                        label="Fecha de contratacion"
                        type="date"
                        value={hireDate}
                        onChange={(event) => setHireDate(event.target.value)}
                        disabled={isLoading}
                        InputLabelProps={{ shrink: true }}
                        helperText="Campo obligatorio para el perfil de enfermeria."
                      />

                      <TextField
                        fullWidth
                        select
                        label="Especialidad"
                        value={specialty}
                        onChange={(event) => setSpecialty(event.target.value)}
                        disabled={isLoading}
                        helperText="Selecciona una especialidad de enfermeria."
                      >
                        <MenuItem value="">
                          <em>Selecciona una especialidad</em>
                        </MenuItem>
                        {nurseSpecialties.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        fullWidth
                        label="Licencia"
                        value={licenseId}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setLicenseId(sanitizeDigitsOnlyInput(nextValue));
                          setLicenseIdInputError(getRejectedDigitsOnlyInputError(nextValue, "La licencia"));
                        }}
                        disabled={isLoading}
                        error={!!displayedLicenseIdError}
                        helperText={displayedLicenseIdError || "Opcional. Solo numeros."}
                        inputProps={{ inputMode: "numeric", pattern: "\\d*" }}
                      />

                      <TextField
                        fullWidth
                        label="Banco"
                        value={bankName}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setBankName(sanitizeTextOnlyInput(nextValue));
                          setBankNameInputError(getRejectedTextOnlyInputError(nextValue, "El banco"));
                        }}
                        disabled={isLoading}
                        error={!!displayedBankNameError}
                        helperText={displayedBankNameError || "Campo obligatorio. Solo letras y espacios."}
                      />

                      <TextField
                        fullWidth
                        label="Numero de cuenta"
                        value={accountNumber}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setAccountNumber(sanitizeDigitsOnlyInput(nextValue));
                          setAccountNumberInputError(getRejectedDigitsOnlyInputError(nextValue, "El numero de cuenta"));
                        }}
                        disabled={isLoading}
                        error={!!displayedAccountNumberError}
                        helperText={displayedAccountNumberError || "Opcional. Solo numeros."}
                        inputProps={{ inputMode: "numeric", pattern: "\\d*" }}
                      />
                    </Stack>
                  </Paper>
                ) : null}
              </>
            )}

            <Button type="submit" variant="contained" size="large" disabled={!canSubmit}>
              {isLoading ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                  {isProfileCompletionMode ? "Guardando perfil" : "Creando cuenta"}
                </>
              ) : (
                isProfileCompletionMode ? "Completar registro" : "Crear cuenta"
              )}
            </Button>

            {!isProfileCompletionMode && (
              <>
                <Divider>o</Divider>

                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                >
                  Continuar con Google
                </Button>

                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                  Google te llevara a completar este mismo formulario antes de entrar.
                </Typography>
              </>
            )}

            <Typography color="text.secondary" sx={{ textAlign: "center" }}>
              {isProfileCompletionMode ? (
                "Completa estos datos para continuar."
              ) : (
                <>
                  ¿Ya tienes acceso?{" "}
                  <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 700 }}>
                    Inicia sesion aqui
                  </Link>
                </>
              )}
            </Typography>
          </Stack>
        </Box>
      }
    />
  );
}

function PaperOption({
  value,
  control,
  label,
  description,
}: {
  value: string;
  control: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Box
      sx={{
        mb: 1.25,
        borderRadius: 4,
        border: "1px solid rgba(23, 48, 66, 0.08)",
        bgcolor: "rgba(255,255,255,0.62)",
        px: 1.5,
        py: 1.2,
      }}
    >
      <FormControlLabel
        value={value}
        control={control}
        label={
          <Box>
            <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
              {description}
            </Typography>
          </Box>
        }
        sx={{ alignItems: "flex-start", m: 0, width: "100%" }}
      />
    </Box>
  );
}

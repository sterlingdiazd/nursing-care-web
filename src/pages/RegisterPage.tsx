import React, { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { validateEmail, validatePassword } from "../api/auth";
import AuthScene from "../components/layout/AuthScene";
import { useAuth } from "../context/AuthContext";
import { RegisterRequest, UserProfileType } from "../types/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileType, setProfileType] = useState<UserProfileType>(UserProfileType.Client);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const isEmailValid = validateEmail(email.trim());
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit =
    !isLoading &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    isEmailValid &&
    passwordValidation.isValid &&
    passwordsMatch;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!canSubmit) {
      setError("Complete the required fields and resolve the validation notes before submitting.");
      return;
    }

    try {
      const payload: RegisterRequest = {
        email: email.trim(),
        password,
        confirmPassword,
        profileType,
      };

      await register(payload);
      setSuccessMessage(
        profileType === UserProfileType.Nurse
          ? "Registration submitted. Nurse accounts stay pending until an administrator activates access."
          : "Registration complete. Your account is ready to sign in."
      );
      navigate("/login");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to register.");
    }
  };

  return (
    <AuthScene
      eyebrow="Create Access"
      title="Register your NursingCare account."
      subtitle="Choose the role that matches how you’ll use the workspace. Client accounts activate immediately; nurse accounts wait for admin approval."
      asideTitle="Approval flow"
      asideBody="Nurse registrations are intentionally staged behind administrative activation so clinical access is reviewed before login is allowed."
      form={
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.25}>
            {error && <Alert severity="error">{error}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@facility.org"
              disabled={isLoading}
              error={email.length > 0 && !isEmailValid}
              helperText={
                email.length > 0 && !isEmailValid
                  ? "Use a valid email format."
                  : "This becomes your username for future sign-ins."
              }
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              error={password.length > 0 && !passwordValidation.isValid}
              helperText={password.length > 0 ? passwordValidation.message : "Minimum 6 characters"}
            />

            <TextField
              fullWidth
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isLoading}
              error={confirmPassword.length > 0 && !passwordsMatch}
              helperText={
                confirmPassword.length > 0 && !passwordsMatch
                  ? "Passwords must match."
                  : "Repeat the password exactly."
              }
            />

            <FormControl>
              <FormLabel sx={{ mb: 1, color: "text.primary" }}>Register as</FormLabel>
              <RadioGroup
                value={String(profileType)}
                onChange={(event) =>
                  setProfileType(Number(event.target.value) as UserProfileType)
                }
              >
                <PaperOption
                  value={String(UserProfileType.Client)}
                  control={<Radio />}
                  label="Client"
                  description="Immediate access after registration."
                />
                <PaperOption
                  value={String(UserProfileType.Nurse)}
                  control={<Radio />}
                  label="Nurse"
                  description="Requires administrator approval before login."
                />
              </RadioGroup>
            </FormControl>

            <Button type="submit" variant="contained" size="large" disabled={!canSubmit}>
              {isLoading ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                  Creating Account
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <Typography color="text.secondary" sx={{ textAlign: "center" }}>
              Already have access?{" "}
              <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 700 }}>
                Sign in here
              </Link>
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

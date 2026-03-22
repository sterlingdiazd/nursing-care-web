import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";

import {
  createAdminClient,
  type CreateAdminClientRequest,
} from "../api/adminClients";
import AdminClientForm, {
  emptyAdminClientFormValues,
  type AdminClientFormValues,
} from "../components/admin/AdminClientForm";
import AdminPortalShell from "../components/layout/AdminPortalShell";

export default function AdminCreateClientPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: AdminClientFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const request: CreateAdminClientRequest = {
        name: values.name,
        lastName: values.lastName,
        identificationNumber: values.identificationNumber,
        phone: values.phone,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      };

      const response = await createAdminClient(request);
      navigate(`/admin/clients/${response.userId}`, {
        state: {
          from: "/admin/clients",
          successMessage: "El cliente se creo correctamente y ya esta listo para gestion administrativa.",
        },
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible crear el cliente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminPortalShell
      eyebrow="Clientes"
      title="Crea clientes manualmente desde el portal administrativo."
      description="Este flujo permite registrar clientes con identidad validada y acceso listo para futuras solicitudes, sin depender del alta publica cuando administracion necesita intervenir."
      actions={(
        <Button variant="outlined" onClick={() => navigate("/admin/clients")}>
          Volver al modulo
        </Button>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Paper sx={{ p: 3, borderRadius: 3.5 }}>
          <Stack spacing={1.2}>
            <Typography variant="h5">Alcance de esta entrega</Typography>
            <Typography color="text.secondary">
              El cliente nace activo, con identidad validada y disponible para que administracion consulte su historial o cree solicitudes en su nombre cuando la politica actual lo permite.
            </Typography>
            <Typography color="text.secondary">
              La desactivacion queda disponible desde el detalle para suspender acceso sin perder trazabilidad historica.
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3.5, borderRadius: 3.5 }}>
          <AdminClientForm
            mode="create"
            initialValues={emptyAdminClientFormValues}
            isSubmitting={isSubmitting}
            submitLabel="Crear cliente"
            onSubmit={handleSubmit}
            onCancel={() => navigate("/admin/clients")}
            helperText="Mantuvimos las mismas reglas de validacion de identidad del resto de la plataforma para evitar divergencias entre portal, backend y aplicaciones cliente."
          />
        </Paper>
      </Stack>
    </AdminPortalShell>
  );
}

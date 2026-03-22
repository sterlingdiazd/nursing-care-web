import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";

import AdminPortalShell from "../components/layout/AdminPortalShell";
import AdminNurseProfileForm, { emptyNurseProfileFormValues } from "../components/admin/AdminNurseProfileForm";
import { createNurseProfileForAdmin } from "../api/adminNurseProfiles";
import { toCreateNurseRequest } from "../utils/adminNurseProfileForm";

export default function AdminCreateNurseProfilePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AdminPortalShell
      eyebrow="Administracion de enfermeria"
      title="Crea perfiles de enfermeria completos desde el portal administrativo."
      description="Este flujo es el camino soportado para altas manuales. Permite dejar a la enfermera activa desde el inicio o crearla inactiva hasta que operaciones decida habilitar su acceso."
      actions={(
        <Button variant="outlined" onClick={() => navigate("/admin/nurse-profiles")}>
          Volver al modulo
        </Button>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Paper sx={{ p: 3, borderRadius: 3.5 }}>
          <Stack spacing={1.2}>
            <Typography variant="h5">Decisiones aplicadas en esta entrega</Typography>
            <Typography color="text.secondary">
              La preparacion para asignacion se deriva del perfil completo y del acceso operativo activo. No se introduce un interruptor separado de disponibilidad para no desalinear el comportamiento con backend y solicitudes.
            </Typography>
            <Typography color="text.secondary">
              Cuando una enfermera tenga historial de solicitudes, administracion debe inactivarla en lugar de intentar eliminarla.
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3.5 }}>
          <AdminNurseProfileForm
            mode="create"
            initialValues={emptyNurseProfileFormValues}
            isSubmitting={isSubmitting}
            submitLabel="Crear perfil de enfermeria"
            helperText="Completa identidad, catalogacion y datos operativos. Si dejas el interruptor activo, la enfermera quedara habilitada para operar y ser asignada desde el primer momento."
            onCancel={() => navigate("/admin/nurse-profiles")}
            onSubmit={async (values) => {
              setIsSubmitting(true);
              setError(null);

              try {
                const response = await createNurseProfileForAdmin(toCreateNurseRequest(values));
                navigate(`/admin/nurse-profiles/${response.userId}`, {
                  state: {
                    from: "/admin/nurse-profiles",
                    successMessage: "La enfermera fue creada correctamente.",
                  },
                });
              } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : "No fue posible crear la enfermera.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        </Paper>
      </Stack>
    </AdminPortalShell>
  );
}

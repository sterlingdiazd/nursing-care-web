import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Paper, Skeleton, Stack, Typography } from "@mui/material";

import AdminPortalShell from "../components/layout/AdminPortalShell";
import AdminNurseProfileForm, { emptyNurseProfileFormValues } from "../components/admin/AdminNurseProfileForm";
import { getNurseProfileForAdmin, updateNurseProfileForAdmin } from "../api/adminNurseProfiles";
import { toNurseIdentityRequest, toNurseProfileFormValues } from "../utils/adminNurseProfileForm";
import { formatNurseDisplayName } from "../utils/adminNurseProfiles";

export default function AdminEditNurseProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [detailName, setDetailName] = useState("Editar perfil de enfermeria");
  const [initialValues, setInitialValues] = useState(emptyNurseProfileFormValues);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPendingReview, setIsPendingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const from = (location.state as { from?: string } | null)?.from ?? "/admin/nurse-profiles";

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    void getNurseProfileForAdmin(id)
      .then((response) => {
        setDetailName(formatNurseDisplayName(response));
        setInitialValues(toNurseProfileFormValues(response));
        setIsPendingReview(Boolean(response.isPendingReview));
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "No fue posible cargar el perfil.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <AdminPortalShell
      eyebrow="Administracion de enfermeria"
      title={`Editar ${detailName}`}
      description="Usa esta vista para corregir identidad, datos bancarios y catalogacion sin alterar la regla de preparacion para asignacion."
      actions={(
        <Button variant="outlined" onClick={() => navigate(id ? `/admin/nurse-profiles/${id}` : "/admin/nurse-profiles", { state: { from } })}>
          Volver al detalle
        </Button>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        {isPendingReview && (
          <Alert severity="warning">
            Este perfil sigue pendiente de revision administrativa. Completa el flujo de revision antes de intentar editarlo como perfil final.
          </Alert>
        )}

        <Paper sx={{ p: 3, borderRadius: 3.5 }}>
          {isLoading ? (
            <Stack spacing={1.25}>
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Stack>
          ) : isPendingReview ? (
            <Stack spacing={2}>
              <Typography color="text.secondary">
                El backend protege este caso para que los perfiles pendientes no salten por encima del flujo de completado.
              </Typography>
              <Button variant="contained" onClick={() => navigate(`/admin/nurse-profiles/${id}/review`, { state: { from } })}>
                Ir al flujo de revision
              </Button>
            </Stack>
          ) : (
            <AdminNurseProfileForm
              mode="edit"
              initialValues={initialValues}
              isSubmitting={isSubmitting}
              submitLabel="Guardar cambios del perfil"
              helperText="Las validaciones de identidad se mantienen alineadas con backend y registro. Si necesitas sacar a la enfermera de operacion, hazlo desde el detalle con el control de acceso operativo."
              onCancel={() => navigate(id ? `/admin/nurse-profiles/${id}` : "/admin/nurse-profiles", { state: { from } })}
              onSubmit={async (values) => {
                if (!id) {
                  return;
                }

                setIsSubmitting(true);
                setError(null);

                try {
                  await updateNurseProfileForAdmin(id, toNurseIdentityRequest(values));
                  navigate(`/admin/nurse-profiles/${id}`, {
                    state: {
                      from,
                      successMessage: "El perfil de enfermeria se actualizo correctamente.",
                    },
                  });
                } catch (nextError) {
                  setError(nextError instanceof Error ? nextError.message : "No fue posible actualizar la enfermera.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            />
          )}
        </Paper>
      </Stack>
    </AdminPortalShell>
  );
}

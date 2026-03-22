import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Paper, Skeleton, Stack } from "@mui/material";

import AdminPortalShell from "../components/layout/AdminPortalShell";
import AdminNurseProfileForm, { emptyNurseProfileFormValues } from "../components/admin/AdminNurseProfileForm";
import { completeNurseProfileForAdmin, getNurseProfileForAdmin } from "../api/adminNurseProfiles";
import { toNurseIdentityRequest, toNurseProfileFormValues } from "../utils/adminNurseProfileForm";
import { formatNurseDisplayName } from "../utils/adminNurseProfiles";

export default function AdminReviewNurseProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [detailName, setDetailName] = useState("Revision de enfermeria");
  const [initialValues, setInitialValues] = useState(emptyNurseProfileFormValues);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPendingReview, setIsPendingReview] = useState(true);
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
      title={`Completar revision de ${detailName}`}
      description="Este flujo termina la revision de perfiles pendientes y habilita el acceso operativo de la enfermera una vez que todos los datos requeridos quedan completos."
      actions={(
        <Button variant="outlined" onClick={() => navigate(id ? `/admin/nurse-profiles/${id}` : "/admin/nurse-profiles", { state: { from } })}>
          Volver al detalle
        </Button>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        {!isLoading && !isPendingReview && (
          <Alert severity="info">
            Este perfil ya no esta pendiente. Usa la vista de edicion si necesitas ajustar informacion.
          </Alert>
        )}

        <Paper sx={{ p: 3, borderRadius: 3.5 }}>
          {isLoading ? (
            <Stack spacing={1.25}>
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Stack>
          ) : !isPendingReview ? (
            <Button variant="contained" onClick={() => navigate(`/admin/nurse-profiles/${id}/edit`, { state: { from } })}>
              Abrir edicion regular
            </Button>
          ) : (
            <AdminNurseProfileForm
              mode="review"
              initialValues={initialValues}
              isSubmitting={isSubmitting}
              submitLabel="Completar perfil y activar acceso"
              helperText="Al guardar, el perfil deja la cola pendiente y la enfermera queda habilitada para entrar a pantallas operativas y para futuras asignaciones."
              onCancel={() => navigate(id ? `/admin/nurse-profiles/${id}` : "/admin/nurse-profiles", { state: { from } })}
              onSubmit={async (values) => {
                if (!id) {
                  return;
                }

                setIsSubmitting(true);
                setError(null);

                try {
                  await completeNurseProfileForAdmin(id, toNurseIdentityRequest(values));
                  navigate(`/admin/nurse-profiles/${id}`, {
                    state: {
                      from,
                      successMessage: "La revision se completo y la enfermera quedo habilitada.",
                    },
                  });
                } catch (nextError) {
                  setError(nextError instanceof Error ? nextError.message : "No fue posible completar la revision.");
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

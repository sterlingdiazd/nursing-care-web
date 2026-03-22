import { useNavigate } from "react-router-dom";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";

import AdminPortalShell from "../components/layout/AdminPortalShell";

interface AdminModulePlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  nextSliceSummary: string;
}

export default function AdminModulePlaceholderPage({
  eyebrow,
  title,
  description,
  nextSliceSummary,
}: AdminModulePlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <AdminPortalShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={
        <Button variant="outlined" onClick={() => navigate("/admin")}>
          Volver al panel principal
        </Button>
      }
    >
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Modulo preparado dentro del portal</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 760 }}>
            Esta ruta ya forma parte de la informacion arquitectonica del portal administrativo para que la navegacion, las protecciones y los accesos desde el tablero queden consolidados desde esta primera entrega.
          </Typography>
          <Alert severity="info" variant="outlined">
            {nextSliceSummary}
          </Alert>
        </Stack>
      </Paper>
    </AdminPortalShell>
  );
}

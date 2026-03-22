import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  getActiveNurseProfiles,
  getInactiveNurseProfiles,
  getPendingNurseProfiles,
  type NurseProfileSummary,
  type PendingNurseProfile,
} from "../api/adminNurseProfiles";
import {
  formatNurseDisplayName,
  formatNurseWorkloadSummary,
  getNurseReadinessLabel,
  getNurseStatusLabel,
  getNurseStatusStyles,
} from "../utils/adminNurseProfiles";

type NurseProfilesView = "pending" | "active" | "inactive";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function matchesSearch(value: string, search: string) {
  return value.toLocaleLowerCase("es-DO").includes(search.toLocaleLowerCase("es-DO"));
}

export default function AdminNurseProfilesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentView: NurseProfilesView = (() => {
    const view = searchParams.get("view");
    return view === "active" || view === "inactive" ? view : "pending";
  })();

  const [pendingProfiles, setPendingProfiles] = useState<PendingNurseProfile[]>([]);
  const [activeProfiles, setActiveProfiles] = useState<NurseProfileSummary[]>([]);
  const [inactiveProfiles, setInactiveProfiles] = useState<NurseProfileSummary[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [pending, active, inactive] = await Promise.all([
        getPendingNurseProfiles(),
        getActiveNurseProfiles(),
        getInactiveNurseProfiles(),
      ]);

      setPendingProfiles(pending);
      setActiveProfiles(active);
      setInactiveProfiles(inactive);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "No fue posible cargar la administracion de enfermeria.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  const filteredPendingProfiles = useMemo(
    () =>
      pendingProfiles.filter((profile) =>
        matchesSearch(
          [profile.name, profile.lastName, profile.email, profile.specialty].filter(Boolean).join(" "),
          search,
        )),
    [pendingProfiles, search],
  );

  const filteredActiveProfiles = useMemo(
    () =>
      activeProfiles.filter((profile) =>
        matchesSearch(
          [profile.name, profile.lastName, profile.email, profile.specialty, profile.category].filter(Boolean).join(" "),
          search,
        )),
    [activeProfiles, search],
  );

  const filteredInactiveProfiles = useMemo(
    () =>
      inactiveProfiles.filter((profile) =>
        matchesSearch(
          [profile.name, profile.lastName, profile.email, profile.specialty, profile.category].filter(Boolean).join(" "),
          search,
        )),
    [inactiveProfiles, search],
  );

  const currentItems = currentView === "pending"
    ? filteredPendingProfiles
    : currentView === "active"
      ? filteredActiveProfiles
      : filteredInactiveProfiles;

  return (
    <AdminPortalShell
      eyebrow="Administracion de enfermeria"
      title="Coordina revision, activacion y carga de enfermeria desde un modulo unico."
      description="La vista separa pendientes, plantilla activa e inactivas para que administracion pueda completar perfiles, editar identidad, controlar acceso operativo y leer carga basica antes de asignar solicitudes."
      actions={(
        <>
          <Button variant="contained" onClick={() => navigate("/admin/nurse-profiles/new")}>
            Crear enfermera
          </Button>
          <Button variant="outlined" onClick={() => void loadProfiles()} disabled={isLoading}>
            Actualizar modulo
          </Button>
        </>
      )}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {[
            {
              key: "pending" as const,
              label: "Pendientes",
              value: pendingProfiles.length,
              description: "Perfiles que todavia requieren revision administrativa.",
            },
            {
              key: "active" as const,
              label: "Activas",
              value: activeProfiles.length,
              description: "Perfiles completos y listos para operar.",
            },
            {
              key: "inactive" as const,
              label: "Inactivas",
              value: inactiveProfiles.length,
              description: "Perfiles completos sin acceso operativo vigente.",
            },
          ].map((card) => (
            <Paper
              key={card.key}
              sx={{
                p: 2.8,
                borderRadius: 3.4,
                bgcolor: currentView === card.key ? "rgba(243, 237, 224, 0.95)" : undefined,
              }}
            >
              <Stack spacing={1.1}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.16em" }}>
                  {card.label}
                </Typography>
                <Typography variant="h4">{card.value}</Typography>
                <Typography color="text.secondary">{card.description}</Typography>
                <Button
                  variant={currentView === card.key ? "contained" : "text"}
                  onClick={() => navigate(`/admin/nurse-profiles?view=${card.key}`)}
                >
                  Abrir vista
                </Button>
              </Stack>
            </Paper>
          ))}
        </Box>

        <Paper sx={{ p: 2.8, borderRadius: 3.4 }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant={currentView === "pending" ? "contained" : "text"}
                onClick={() => navigate("/admin/nurse-profiles?view=pending")}
              >
                Cola pendiente
              </Button>
              <Button
                variant={currentView === "active" ? "contained" : "text"}
                onClick={() => navigate("/admin/nurse-profiles?view=active")}
              >
                Plantilla activa
              </Button>
              <Button
                variant={currentView === "inactive" ? "contained" : "text"}
                onClick={() => navigate("/admin/nurse-profiles?view=inactive")}
              >
                Plantilla inactiva
              </Button>
            </Stack>

            <TextField
              label="Buscar enfermera"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre, correo o especialidad"
              sx={{ minWidth: { lg: 320 } }}
            />
          </Stack>
        </Paper>

        <Stack spacing={2}>
          {currentItems.length === 0 ? (
            <Paper sx={{ p: 3.2, borderRadius: 3.4 }}>
              <Typography variant="h6">
                {isLoading ? "Cargando administracion de enfermeria..." : "No hay perfiles para esta vista."}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                Ajusta la busqueda o cambia de vista para seguir revisando el modulo.
              </Typography>
            </Paper>
          ) : currentView === "pending" ? (
            filteredPendingProfiles.map((profile) => (
              <Paper key={profile.userId} sx={{ p: 2.8, borderRadius: 3.2 }}>
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={1.25}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", lg: "center" }}
                  >
                    <Stack spacing={0.6}>
                      <Typography variant="h5">{formatNurseDisplayName(profile)}</Typography>
                      <Typography color="text.secondary">{profile.email}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label="Pendiente de revision"
                        sx={{ bgcolor: "rgba(193, 138, 66, 0.14)", color: "#8a5e22", fontWeight: 700 }}
                      />
                      <Chip label={profile.specialty ?? "Especialidad por confirmar"} variant="outlined" />
                    </Stack>
                  </Stack>

                  <Typography color="text.secondary">
                    Registrada {formatDateTime(profile.createdAtUtc)}.
                  </Typography>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/admin/nurse-profiles/${profile.userId}/review`, { state: { from: location.pathname + location.search } })}
                    >
                      Completar revision
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/admin/nurse-profiles/${profile.userId}`, { state: { from: location.pathname + location.search } })}
                    >
                      Ver detalle
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))
          ) : (
            (currentView === "active" ? filteredActiveProfiles : filteredInactiveProfiles).map((profile) => {
              const statusStyles = getNurseStatusStyles(profile);

              return (
                <Paper key={profile.userId} sx={{ p: 2.8, borderRadius: 3.2 }}>
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: "column", lg: "row" }}
                      spacing={1.25}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", lg: "center" }}
                    >
                      <Stack spacing={0.6}>
                        <Typography variant="h5">{formatNurseDisplayName(profile)}</Typography>
                        <Typography color="text.secondary">{profile.email}</Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={getNurseStatusLabel(profile)} sx={{ bgcolor: statusStyles.bg, color: statusStyles.color, fontWeight: 700 }} />
                        <Chip label={getNurseReadinessLabel(profile)} variant="outlined" />
                      </Stack>
                    </Stack>

                    <Typography color="text.secondary">
                      {[profile.specialty, profile.category].filter(Boolean).join(" · ") || "Sin catalogacion visible"}
                    </Typography>

                    <Typography color="text.secondary">
                      {formatNurseWorkloadSummary(profile.workload)}
                    </Typography>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                      <Button
                        variant="contained"
                        onClick={() => navigate(`/admin/nurse-profiles/${profile.userId}`, { state: { from: location.pathname + location.search } })}
                      >
                        Ver detalle
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/admin/nurse-profiles/${profile.userId}/edit`, { state: { from: location.pathname + location.search } })}
                      >
                        Editar perfil
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })
          )}
        </Stack>
      </Stack>
    </AdminPortalShell>
  );
}

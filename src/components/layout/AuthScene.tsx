import type { ReactNode } from "react";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";

interface AuthSceneProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  asideTitle: string;
  asideBody: string;
  form: ReactNode;
}

export default function AuthScene({
  eyebrow,
  title,
  subtitle,
  asideTitle,
  asideBody,
  form,
}: AuthSceneProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "radial-gradient(circle at top left, rgba(34, 95, 145, 0.18), transparent 25%), linear-gradient(180deg, #f7f4ee 0%, #edf2f4 100%)",
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <Paper
            sx={{
              minHeight: { lg: 720 },
              p: { xs: 3.5, md: 5 },
              borderRadius: 3,
              bgcolor: "#112c3f",
              color: "#f7f6f0",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 18% 20%, rgba(116, 189, 184, 0.24), transparent 20%), radial-gradient(circle at 78% 24%, rgba(241, 177, 90, 0.16), transparent 22%), linear-gradient(145deg, rgba(255,255,255,0.02), transparent 45%)",
              }}
            />
            <Stack spacing={4.5} sx={{ position: "relative", zIndex: 1 }}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.24em", color: "#9ed0cf" }}>
                  NursingCare
                </Typography>
                <Typography variant="h1" sx={{ mt: 2, maxWidth: 620 }}>
                  Operaciones de cuidado con un flujo mas claro y sereno.
                </Typography>
                <Typography sx={{ mt: 2.5, maxWidth: 580, lineHeight: 1.85, color: "#d4e6ea" }}>
                  Un espacio profesional para captura, revision y coordinacion del ciclo de vida
                  entre administracion, enfermeria y clientes.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  gap: 2,
                }}
              >
                {[
                  ["Cola en vivo", "Las solicitudes avanzan de la captura a la aprobacion y al cierre en un solo lugar."],
                  ["Acceso por rol", "Las acciones solo aparecen cuando la sesion actual tiene permiso para ejecutarlas."],
                  ["Sesion persistente", "El estado de inicio de sesion y los refresh tokens mantienen el espacio estable."],
                  ["Flujo auditable", "Las marcas de tiempo se mantienen visibles desde la creacion hasta el cierre."],
                ].map(([cardTitle, cardBody]) => (
                  <Paper
                    key={cardTitle}
                    sx={{
                      p: 2.25,
                      borderRadius: 2.5,
                      bgcolor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "inherit",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, mb: 0.8 }}>{cardTitle}</Typography>
                    <Typography sx={{ color: "#cfe0e4", lineHeight: 1.7 }}>{cardBody}</Typography>
                  </Paper>
                ))}
              </Box>
            </Stack>
          </Paper>

          <Paper
            sx={{
              minHeight: { lg: 720 },
              p: { xs: 3.5, md: 5 },
              borderRadius: 3,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(251,248,242,0.98) 100%)",
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.18em" }}>
                  {eyebrow}
                </Typography>
                <Typography variant="h2" sx={{ mt: 1.2 }}>
                  {title}
                </Typography>
                <Typography sx={{ mt: 1.3, color: "text.secondary", lineHeight: 1.8 }}>
                  {subtitle}
                </Typography>
              </Box>

              {form}
            </Stack>

            <Paper
              sx={{
                mt: 3,
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: "#f3ede0",
                border: "1px solid rgba(160, 122, 61, 0.16)",
                boxShadow: "none",
              }}
            >
              <Typography sx={{ fontWeight: 700, color: "#5a4120", mb: 0.8 }}>
                {asideTitle}
              </Typography>
              <Typography sx={{ color: "#6d5a3d", lineHeight: 1.7 }}>{asideBody}</Typography>
            </Paper>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

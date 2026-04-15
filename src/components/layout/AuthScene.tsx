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
          "radial-gradient(circle at top left, rgba(184, 214, 223, 0.48), transparent 24%), radial-gradient(circle at 85% 14%, rgba(228, 236, 240, 0.72), transparent 20%), linear-gradient(180deg, #f9fbfc 0%, #eef4f5 55%, #eef1ef 100%)",
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
              borderRadius: 4,
              bgcolor: "#e8f0f3",
              color: "#36505d",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 16% 18%, rgba(255, 255, 255, 0.65), transparent 20%), radial-gradient(circle at 82% 20%, rgba(154, 190, 201, 0.24), transparent 24%), linear-gradient(145deg, rgba(255,255,255,0.48), transparent 55%)",
              }}
            />
            <Stack spacing={4.5} sx={{ position: "relative", zIndex: 1 }}>
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: "0.24em", color: "#6f94a3" }}>
                  NursingCare
                </Typography>
                <Typography variant="h1" sx={{ mt: 2, maxWidth: 620 }}>
                  Operaciones de cuidado con un flujo mas claro y sereno.
                </Typography>
                <Typography sx={{ mt: 2.5, maxWidth: 580, lineHeight: 1.85, color: "#5e7985" }}>
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
                      borderRadius: 3,
                      bgcolor: "rgba(255,255,255,0.62)",
                      border: "1px solid rgba(111, 148, 163, 0.14)",
                      color: "inherit",
                      boxShadow: "none",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, mb: 0.8 }}>{cardTitle}</Typography>
                    <Typography sx={{ color: "#65808c", lineHeight: 1.7 }}>{cardBody}</Typography>
                  </Paper>
                ))}
              </Box>
            </Stack>
          </Paper>

          <Paper
            sx={{
              minHeight: { lg: 720 },
              p: { xs: 3.5, md: 5 },
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(246,250,251,0.98) 100%)",
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
                borderRadius: 3,
                bgcolor: "#f3f6f3",
                border: "1px solid rgba(111, 148, 163, 0.12)",
                boxShadow: "none",
              }}
            >
              <Typography sx={{ fontWeight: 700, color: "#516b62", mb: 0.8 }}>
                {asideTitle}
              </Typography>
              <Typography sx={{ color: "#70827a", lineHeight: 1.7 }}>{asideBody}</Typography>
            </Paper>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

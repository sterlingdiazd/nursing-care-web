import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import type { AdminActionItem } from "../../api/adminActionItems";
import {
  formatAdminActionItemDetectedAt,
  formatAdminActionItemEntityLabel,
  formatAdminActionItemSeverityLabel,
  formatAdminActionItemStateLabel,
  getAdminActionItemSeverityStyles,
  getAdminActionItemStateStyles,
} from "../../utils/adminActionItems";

interface AdminActionItemCardProps {
  item: AdminActionItem;
  onOpen: (path: string) => void;
  compact?: boolean;
}

export default function AdminActionItemCard({
  item,
  onOpen,
  compact = false,
}: AdminActionItemCardProps) {
  const severityStyles = getAdminActionItemSeverityStyles(item.severity);
  const stateStyles = getAdminActionItemStateStyles(item.state);
  const entityLabel = formatAdminActionItemEntityLabel(item.entityType);

  return (
    <Paper
      sx={{
        p: compact ? 2.5 : 3,
        borderRadius: 3.5,
        borderLeft: `4px solid ${severityStyles.color}`,
        bgcolor: item.state === "Unread" ? "rgba(255, 252, 246, 0.98)" : "rgba(255, 255, 255, 0.92)",
        boxShadow:
          item.state === "Unread"
            ? "0 18px 34px rgba(15, 23, 42, 0.08)"
            : "0 10px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Stack spacing={compact ? 1.5 : 2}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", lg: "center" }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={formatAdminActionItemSeverityLabel(item.severity)}
              sx={{
                bgcolor: severityStyles.bg,
                color: severityStyles.color,
                border: `1px solid ${severityStyles.border}`,
                fontWeight: 700,
              }}
            />
            <Chip
              label={formatAdminActionItemStateLabel(item.state)}
              sx={{
                bgcolor: stateStyles.bg,
                color: stateStyles.color,
                border: `1px solid ${stateStyles.border}`,
                fontWeight: 700,
              }}
            />
            <Chip
              label={entityLabel}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Stack>

          <Typography color="text.secondary">
            {formatAdminActionItemDetectedAt(item.detectedAtUtc)}
          </Typography>
        </Stack>

        <Box>
          <Typography variant="h6" sx={{ lineHeight: 1.35 }}>
            {item.summary}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.9, lineHeight: 1.75 }}>
            {item.requiredAction}
          </Typography>
        </Box>

        {!compact && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            {[
              ["Entidad", entityLabel],
              ["Identificador", item.entityIdentifier],
              ["Responsable", item.assignedOwner ?? "Sin responsable asignado"],
            ].map(([label, value]) => (
              <Box key={label}>
                <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: "0.12em" }}>
                  {label}
                </Typography>
                <Typography sx={{ mt: 0.45 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} justifyContent="space-between">
          <Typography color="text.secondary">
            {compact
              ? `Referencia ${item.entityIdentifier}`
              : "Acceso directo listo para abrir el detalle administrativo correspondiente."}
          </Typography>
          <Button
            variant={compact ? "text" : "contained"}
            onClick={() => onOpen(item.deepLinkPath)}
            aria-label={`Abrir ${entityLabel.toLowerCase()} ${item.entityIdentifier}`}
          >
            Abrir detalle
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

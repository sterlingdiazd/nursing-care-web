import { Paper, Stack, Typography, Box } from "@mui/material";
import { ReactNode } from "react";

interface AdminMetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  isSelected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  tone?: "primary" | "secondary" | "success" | "warning" | "info";
}

export default function AdminMetricCard({
  label,
  value,
  description,
  isSelected,
  onClick,
  icon,
  tone = "secondary",
}: AdminMetricCardProps) {
  const getToneStyles = () => {
    switch (tone) {
      case "primary": return { bg: "rgba(31, 75, 110, 0.04)", border: "rgba(31, 75, 110, 0.15)", text: "primary.main" };
      case "success": return { bg: "rgba(44, 122, 100, 0.04)", border: "rgba(44, 122, 100, 0.15)", text: "success.main" };
      case "warning": return { bg: "rgba(193, 138, 66, 0.04)", border: "rgba(193, 138, 66, 0.15)", text: "warning.main" };
      case "info": return { bg: "rgba(59, 108, 141, 0.04)", border: "rgba(59, 108, 141, 0.15)", text: "info.main" };
      default: return { bg: "rgba(183, 128, 60, 0.04)", border: "rgba(183, 128, 60, 0.15)", text: "secondary.main" };
    }
  };

  const toneStyles = getToneStyles();

  return (
    <Paper
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label}
      sx={{
        p: 2.8,
        borderRadius: 3.5,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        bgcolor: isSelected ? toneStyles.bg : "background.paper",
        border: "1px solid",
        borderColor: isSelected ? toneStyles.text : "rgba(23, 48, 66, 0.08)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": onClick ? {
          transform: "translateY(-4px)",
          boxShadow: (theme) => theme.shadows[6],
          borderColor: toneStyles.text,
        } : undefined,
      }}
    >
      {isSelected && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 4,
            height: "100%",
            bgcolor: toneStyles.text,
          }}
        />
      )}
      <Stack spacing={1.2}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          {icon}
          <Typography
            variant="overline"
            sx={{
              color: isSelected ? toneStyles.text : "text.secondary",
              letterSpacing: "0.14em",
              fontWeight: 800,
              fontSize: "0.72rem",
            }}
          >
            {label}
          </Typography>
        </Stack>
        <Typography 
          variant="h3" 
          sx={{ 
            color: isSelected ? toneStyles.text : "text.primary",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8, lineHeight: 1.6 }}>
            {description}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

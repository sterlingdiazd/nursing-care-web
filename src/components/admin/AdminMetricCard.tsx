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
      case "primary": return { bg: "rgba(111, 148, 163, 0.08)", border: "rgba(111, 148, 163, 0.18)", text: "primary.main" };
      case "success": return { bg: "rgba(125, 169, 147, 0.08)", border: "rgba(125, 169, 147, 0.18)", text: "success.main" };
      case "warning": return { bg: "rgba(168, 183, 190, 0.08)", border: "rgba(168, 183, 190, 0.18)", text: "warning.main" };
      case "info": return { bg: "rgba(124, 167, 187, 0.08)", border: "rgba(124, 167, 187, 0.18)", text: "info.main" };
      default: return { bg: "rgba(138, 167, 160, 0.08)", border: "rgba(138, 167, 160, 0.18)", text: "secondary.main" };
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
        borderColor: isSelected ? toneStyles.text : "rgba(111, 148, 163, 0.12)",
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

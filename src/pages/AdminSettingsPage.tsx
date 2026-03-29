import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Translate as LanguageIcon,
  Dashboard as DashboardIcon,
  Timer as ClockIcon,
  ToggleOn as FeatureIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import AdminPortalShell from "../components/layout/AdminPortalShell";
import { getAdminSettings, updateAdminSetting, type SystemSetting } from "../api/adminSettings";
import { logClientEvent } from "../logging/clientLogger";

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Localization":
      return <LanguageIcon color="primary" />;
    case "Dashboard":
      return <DashboardIcon color="primary" />;
    case "Operations":
      return <ClockIcon color="primary" />;
    case "General":
    default:
      return <SettingsIcon color="primary" />;
  }
};

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getAdminSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(t("adminSettings.errors.load"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    try {
      setSavingKey(key);
      await updateAdminSetting(key, { value });
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value, modifiedAtUtc: new Date().toISOString() } : s))
      );
      logClientEvent("admin.settings", "Updated system setting", { key, value });
    } catch (err) {
      setError(t("adminSettings.errors.update", { key }));
      console.error(err);
    } finally {
      setSavingKey(null);
    }
  };

  const renderValueInput = (setting: SystemSetting) => {
    const isSaving = savingKey === setting.key;

    if (setting.valueType === "Boolean") {
      const checked = setting.value.toLowerCase() === "true";
      return (
        <Stack direction="row" spacing={2} alignItems="center">
          <Switch
            checked={checked}
            disabled={isSaving}
            onChange={(e) => handleUpdate(setting.key, e.target.checked.toString().toLowerCase())}
          />
          <Typography variant="body2" color="text.secondary">
            {checked ? "Activado" : "Desactivado"}
          </Typography>
        </Stack>
      );
    }

    if (setting.valueType === "Select" && setting.allowedValuesJson) {
      try {
        const options: string[] = JSON.parse(setting.allowedValuesJson);
        return (
          <TextField
            select
            fullWidth
            size="small"
            value={setting.value}
            disabled={isSaving}
            onChange={(e) => handleUpdate(setting.key, e.target.value)}
          >
            {options.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt.toUpperCase()}
              </MenuItem>
            ))}
          </TextField>
        );
      } catch (e) {
        return <Typography color="error">Error at parsing options</Typography>;
      }
    }

    return (
      <TextField
        fullWidth
        size="small"
        type={setting.valueType === "Number" ? "number" : "text"}
        value={setting.value}
        disabled={isSaving}
        onBlur={(e) => {
            if (e.target.value !== setting.value) {
                handleUpdate(setting.key, e.target.value);
            }
        }}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            const target = e.target as HTMLInputElement;
            if (target.value !== setting.value) {
              handleUpdate(setting.key, target.value);
              target.blur();
            }
          }
        }}
      />
    );
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  if (loading && settings.length === 0) {
    return (
      <AdminPortalShell
        eyebrow={t("adminSettings.eyebrow")}
        title={t("adminSettings.title")}
        description={t("adminSettings.description")}
      >
        <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
          <CircularProgress />
        </Box>
      </AdminPortalShell>
    );
  }

  return (
    <AdminPortalShell
      eyebrow={t("adminSettings.eyebrow")}
      title={t("adminSettings.title")}
      description={t("adminSettings.description")}
      actions={
        <Button startIcon={<ClockIcon />} variant="outlined" onClick={fetchSettings}>
          {t("adminSettings.actions.refresh")}
        </Button>
      }
    >
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {Object.entries(groupedSettings).map(([category, items]) => (
          <Box key={category}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, mt: 1 }}>
              {getCategoryIcon(category)}
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t(`adminSettings.categories.${category}`, { defaultValue: category })}
              </Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              {items.map((setting) => (
                <Card key={setting.key} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flex: 1 }}>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                            {setting.key}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                            {setting.description}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                        
                        <Box sx={{ minHeight: 48, display: "flex", alignItems: "center" }}>
                          {renderValueInput(setting)}
                        </Box>

                        {setting.modifiedByActorName && (
                          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                            {t("adminSettings.metadata.modifiedBy", { 
                                actor: setting.modifiedByActorName, 
                                date: new Date(setting.modifiedAtUtc).toLocaleDateString() 
                            })}
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
              ))}
            </Box>
          </Box>
        ))}

        <Paper sx={{ p: 4, borderRadius: 4, mt: 4, bgcolor: 'rgba(255, 255, 255, 0.4)' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{t("adminSettings.auditTrail.title")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {t("adminSettings.auditTrail.description")}
          </Typography>
          <Button 
            sx={{ mt: 2 }} 
            onClick={() => navigate("/admin/audit-logs")}
            variant="text" 
            size="small"
          >
            {t("adminSettings.auditTrail.action")}
          </Button>
        </Paper>
      </Stack>
    </AdminPortalShell>
  );
}

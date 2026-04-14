import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import AdminPortalShell from "../components/layout/AdminPortalShell";
import {
  type CareRequestCategoryListItem,
  type CareRequestTypeListItem,
  type ComplexityLevelListItem,
  type DistanceFactorListItem,
  type NurseCategoryListItem,
  type NurseSpecialtyListItem,
  type UnitTypeListItem,
  type VolumeDiscountRuleListItem,
  createCareRequestCategory,
  createCareRequestType,
  createComplexityLevel,
  createDistanceFactor,
  createNurseCategory,
  createNurseSpecialty,
  createUnitType,
  createVolumeDiscountRule,
  listCareRequestCategories,
  listCareRequestTypes,
  listComplexityLevels,
  listDistanceFactors,
  listNurseCategories,
  listNurseSpecialties,
  listUnitTypes,
  listVolumeDiscountRules,
  previewPricing,
  updateCareRequestCategory,
  updateCareRequestType,
  updateComplexityLevel,
  updateDistanceFactor,
  updateNurseCategory,
  updateNurseSpecialty,
  updateUnitType,
  updateVolumeDiscountRule,
} from "../api/adminCatalog";
import { getCareRequestOptions } from "../api/catalogOptions";
import { extractApiErrorMessage } from "../api/errorMessage";
import type { CatalogOptionsResponse, PricingPreviewResponse } from "../types/catalog";

type TabKey =
  | "categories"
  | "types"
  | "units"
  | "distance"
  | "complexity"
  | "volume"
  | "spec"
  | "ncat"
  | "preview";

export default function AdminPricingCatalogPage() {
  const [tab, setTab] = useState<TabKey>("categories");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CareRequestCategoryListItem[]>([]);
  const [types, setTypes] = useState<CareRequestTypeListItem[]>([]);
  const [units, setUnits] = useState<UnitTypeListItem[]>([]);
  const [distances, setDistances] = useState<DistanceFactorListItem[]>([]);
  const [complexities, setComplexities] = useState<ComplexityLevelListItem[]>([]);
  const [volumeRules, setVolumeRules] = useState<VolumeDiscountRuleListItem[]>([]);
  const [specialties, setSpecialties] = useState<NurseSpecialtyListItem[]>([]);
  const [nurseCategories, setNurseCategories] = useState<NurseCategoryListItem[]>([]);
  const [previewOptions, setPreviewOptions] = useState<CatalogOptionsResponse | null>(null);

  const reloadAll = useCallback(async () => {
    setError(null);
    try {
      const [
        c,
        t,
        u,
        d,
        x,
        v,
        s,
        n,
        activeOptions,
      ] = await Promise.all([
        listCareRequestCategories(includeInactive),
        listCareRequestTypes(includeInactive),
        listUnitTypes(includeInactive),
        listDistanceFactors(includeInactive),
        listComplexityLevels(includeInactive),
        listVolumeDiscountRules(includeInactive),
        listNurseSpecialties(includeInactive),
        listNurseCategories(includeInactive),
        getCareRequestOptions(),
      ]);
      setCategories(c);
      setTypes(t);
      setUnits(u);
      setDistances(d);
      setComplexities(x);
      setVolumeRules(v);
      setSpecialties(s);
      setNurseCategories(n);
      setPreviewOptions(activeOptions);
    } catch (e) {
      setError(extractApiErrorMessage(e, "No fue posible cargar el catalogo."));
    }
  }, [includeInactive]);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

  return (
    <AdminPortalShell
      eyebrow="Administracion"
      title="Catalogo de precios y parametros"
      description="Gestiona categorias, tipos, factores y reglas. Los cambios aplican a solicitudes nuevas; las solicitudes existentes conservan su instantanea de precio. Usa la pestana de vista previa para validar el impacto antes de publicar ajustes sensibles."
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <FormControlLabel
            control={
              <Checkbox
                checked={includeInactive}
                onChange={(_, checked) => setIncludeInactive(checked)}
              />
            }
            label="Mostrar inactivos"
          />
          <Button data-testid="admin-catalog-reload-button" variant="outlined" onClick={() => void reloadAll()}>
            Recargar
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2.5} data-testid="admin-catalog-page">
        {flash && <Alert severity="success">{flash}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Paper sx={{ px: 2, pt: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Categorias" value="categories" />
            <Tab label="Tipos de solicitud" value="types" />
            <Tab label="Tipos de unidad" value="units" />
            <Tab label="Distancia" value="distance" />
            <Tab label="Complejidad" value="complexity" />
            <Tab label="Descuentos volumen" value="volume" />
            <Tab label="Especialidades" value="spec" />
            <Tab data-testid="admin-catalog-tab-nurse-categories" label="Categorias enfermeria" value="ncat" />
            <Tab data-testid="admin-catalog-tab-pricing-preview" label="Vista previa precios" value="preview" />
          </Tabs>
        </Paper>

        {tab === "categories" && (
          <CategorySection
            rows={categories}
            onChanged={async () => {
              setFlash("Categoria actualizada.");
              await reloadAll();
            }}
          />
        )}
        {tab === "types" && (
          <TypeSection
            rows={types}
            categoryCodes={categories.map((c) => c.code)}
            unitCodes={units.map((u) => u.code)}
            onChanged={async () => {
              setFlash("Tipo de solicitud guardado.");
              await reloadAll();
            }}
          />
        )}
        {tab === "units" && (
          <UnitSection
            rows={units}
            onChanged={async () => {
              setFlash("Tipo de unidad guardado.");
              await reloadAll();
            }}
          />
        )}
        {tab === "distance" && (
          <DistanceSection
            rows={distances}
            onChanged={async () => {
              setFlash("Factor de distancia guardado.");
              await reloadAll();
            }}
          />
        )}
        {tab === "complexity" && (
          <ComplexitySection
            rows={complexities}
            onChanged={async () => {
              setFlash("Nivel de complejidad guardado.");
              await reloadAll();
            }}
          />
        )}
        {tab === "volume" && (
          <VolumeSection
            rows={volumeRules}
            onChanged={async () => {
              setFlash("Regla de descuento guardada.");
              await reloadAll();
            }}
          />
        )}
        {tab === "spec" && (
          <NurseSpecialtySection
            rows={specialties}
            onChanged={async () => {
              setFlash("Especialidad guardada.");
              await reloadAll();
            }}
          />
        )}
        {tab === "ncat" && (
          <NurseCategorySection
            rows={nurseCategories}
            onChanged={async () => {
              setFlash("Categoria de enfermeria guardada.");
              await reloadAll();
            }}
          />
        )}
        {tab === "preview" && previewOptions && (
          <PricingPreviewPanel options={previewOptions} />
        )}
      </Stack>
    </AdminPortalShell>
  );
}

function CategorySection({
  rows,
  onChanged,
}: {
  rows: CareRequestCategoryListItem[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<CareRequestCategoryListItem | null>(null);
  const [form, setForm] = useState({
    code: "",
    displayName: "",
    categoryFactor: 1,
    isActive: true,
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setEdit(null);
    setForm({ code: "", displayName: "", categoryFactor: 1, isActive: true, displayOrder: rows.length });
    setOpen(true);
  };

  const startEdit = (row: CareRequestCategoryListItem) => {
    setEdit(row);
    setForm({
      code: row.code,
      displayName: row.displayName,
      categoryFactor: row.categoryFactor,
      isActive: row.isActive,
      displayOrder: row.displayOrder,
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (edit) {
        await updateCareRequestCategory(edit.id, {
          displayName: form.displayName,
          categoryFactor: form.categoryFactor,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      } else {
        await createCareRequestCategory({
          code: form.code.trim(),
          displayName: form.displayName.trim(),
          categoryFactor: form.categoryFactor,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      }
      setOpen(false);
      await onChanged();
    } catch (e) {
      window.alert(extractApiErrorMessage(e, "No fue posible guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Categorias de precios</Typography>
        <Button variant="contained" onClick={startCreate}>
          Nueva categoria
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Codigo</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Factor</TableCell>
            <TableCell>Orden</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.displayName}</TableCell>
              <TableCell>{row.categoryFactor}</TableCell>
              <TableCell>{row.displayOrder}</TableCell>
              <TableCell>{row.isActive ? "Si" : "No"}</TableCell>
              <TableCell align="right">
                <Button data-testid="admin-catalog-nurse-category-edit-button" size="small" onClick={() => startEdit(row)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog data-testid="admin-catalog-nurse-category-dialog" open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit ? "Editar categoria" : "Nueva categoria"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!edit && (
              <TextField
                label="Codigo"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                helperText="Identificador estable (sin espacios recomendado)."
              />
            )}
            <TextField
              label="Nombre visible"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
            <TextField
              label="Factor de categoria"
              type="number"
              value={form.categoryFactor}
              onChange={(e) => setForm((f) => ({ ...f, categoryFactor: Number(e.target.value) }))}
            />
            <TextField
              label="Orden"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(_, c) => setForm((f) => ({ ...f, isActive: c }))}
                />
              }
              label="Activo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} variant="contained" disabled={saving}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function TypeSection({
  rows,
  categoryCodes,
  unitCodes,
  onChanged,
}: {
  rows: CareRequestTypeListItem[];
  categoryCodes: string[];
  unitCodes: string[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<CareRequestTypeListItem | null>(null);
  const [form, setForm] = useState({
    code: "",
    displayName: "",
    careRequestCategoryCode: categoryCodes[0] ?? "",
    unitTypeCode: unitCodes[0] ?? "",
    basePrice: 0,
    isActive: true,
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      careRequestCategoryCode: f.careRequestCategoryCode || categoryCodes[0] || "",
      unitTypeCode: f.unitTypeCode || unitCodes[0] || "",
    }));
  }, [categoryCodes, unitCodes]);

  const startCreate = () => {
    setEdit(null);
    setForm({
      code: "",
      displayName: "",
      careRequestCategoryCode: categoryCodes[0] ?? "",
      unitTypeCode: unitCodes[0] ?? "",
      basePrice: 0,
      isActive: true,
      displayOrder: rows.length,
    });
    setOpen(true);
  };

  const startEdit = (row: CareRequestTypeListItem) => {
    setEdit(row);
    setForm({
      code: row.code,
      displayName: row.displayName,
      careRequestCategoryCode: row.careRequestCategoryCode,
      unitTypeCode: row.unitTypeCode,
      basePrice: row.basePrice,
      isActive: row.isActive,
      displayOrder: row.displayOrder,
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (edit) {
        await updateCareRequestType(edit.id, {
          displayName: form.displayName,
          careRequestCategoryCode: form.careRequestCategoryCode,
          unitTypeCode: form.unitTypeCode,
          basePrice: form.basePrice,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      } else {
        await createCareRequestType({
          code: form.code.trim(),
          displayName: form.displayName.trim(),
          careRequestCategoryCode: form.careRequestCategoryCode,
          unitTypeCode: form.unitTypeCode,
          basePrice: form.basePrice,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      }
      setOpen(false);
      await onChanged();
    } catch (e) {
      window.alert(extractApiErrorMessage(e, "No fue posible guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Tipos de solicitud</Typography>
        <Button variant="contained" onClick={startCreate}>
          Nuevo tipo
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Codigo</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Unidad</TableCell>
            <TableCell>Precio base</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.displayName}</TableCell>
              <TableCell>{row.careRequestCategoryCode}</TableCell>
              <TableCell>{row.unitTypeCode}</TableCell>
              <TableCell>{row.basePrice}</TableCell>
              <TableCell>{row.isActive ? "Si" : "No"}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => startEdit(row)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit ? "Editar tipo" : "Nuevo tipo"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!edit && (
              <TextField label="Codigo" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            )}
            <TextField
              label="Nombre visible"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              slotProps={{ htmlInput: { "data-testid": "admin-catalog-nurse-category-name-input" } }}
            />
            <TextField select label="Categoria" value={form.careRequestCategoryCode} SelectProps={{ native: true }} onChange={(e) => setForm((f) => ({ ...f, careRequestCategoryCode: e.target.value }))}>
              {categoryCodes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </TextField>
            <TextField select label="Tipo de unidad" value={form.unitTypeCode} SelectProps={{ native: true }} onChange={(e) => setForm((f) => ({ ...f, unitTypeCode: e.target.value }))}>
              {unitCodes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </TextField>
            <TextField label="Precio base" type="number" value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: Number(e.target.value) }))} />
            <TextField label="Orden" type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} />
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(_, c) => setForm((f) => ({ ...f, isActive: c }))} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button data-testid="admin-catalog-nurse-category-save-button" onClick={() => void submit()} variant="contained" disabled={saving}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function UnitSection({
  rows,
  onChanged,
}: {
  rows: UnitTypeListItem[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<UnitTypeListItem | null>(null);
  const [form, setForm] = useState({ code: "", displayName: "", isActive: true, displayOrder: 0 });
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setEdit(null);
    setForm({ code: "", displayName: "", isActive: true, displayOrder: rows.length });
    setOpen(true);
  };

  const startEdit = (row: UnitTypeListItem) => {
    setEdit(row);
    setForm({
      code: row.code,
      displayName: row.displayName,
      isActive: row.isActive,
      displayOrder: row.displayOrder,
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (edit) {
        await updateUnitType(edit.id, {
          displayName: form.displayName,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      } else {
        await createUnitType({
          code: form.code.trim(),
          displayName: form.displayName.trim(),
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      }
      setOpen(false);
      await onChanged();
    } catch (e) {
      window.alert(extractApiErrorMessage(e, "No fue posible guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }} data-testid="admin-catalog-pricing-preview-panel">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Tipos de unidad</Typography>
        <Button variant="contained" onClick={startCreate}>
          Nuevo
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Codigo</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Orden</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.displayName}</TableCell>
              <TableCell>{row.displayOrder}</TableCell>
              <TableCell>{row.isActive ? "Si" : "No"}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => startEdit(row)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit ? "Editar tipo de unidad" : "Nuevo tipo de unidad"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!edit && <TextField label="Codigo" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />}
            <TextField label="Nombre visible" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
            <TextField label="Orden" type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} />
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(_, c) => setForm((f) => ({ ...f, isActive: c }))} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} variant="contained" disabled={saving}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function DistanceSection({
  rows,
  onChanged,
}: {
  rows: DistanceFactorListItem[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<DistanceFactorListItem | null>(null);
  const [form, setForm] = useState({
    code: "",
    displayName: "",
    multiplier: 1,
    isActive: true,
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setEdit(null);
    setForm({ code: "", displayName: "", multiplier: 1, isActive: true, displayOrder: rows.length });
    setOpen(true);
  };

  const startEdit = (row: DistanceFactorListItem) => {
    setEdit(row);
    setForm({
      code: row.code,
      displayName: row.displayName,
      multiplier: row.multiplier,
      isActive: row.isActive,
      displayOrder: row.displayOrder,
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (edit) {
        await updateDistanceFactor(edit.id, {
          displayName: form.displayName,
          multiplier: form.multiplier,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      } else {
        await createDistanceFactor({
          code: form.code.trim(),
          displayName: form.displayName.trim(),
          multiplier: form.multiplier,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      }
      setOpen(false);
      await onChanged();
    } catch (e) {
      window.alert(extractApiErrorMessage(e, "No fue posible guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Factores de distancia</Typography>
        <Button variant="contained" onClick={startCreate}>
          Nuevo
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Codigo</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Multiplicador</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.displayName}</TableCell>
              <TableCell>{row.multiplier}</TableCell>
              <TableCell>{row.isActive ? "Si" : "No"}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => startEdit(row)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit ? "Editar factor" : "Nuevo factor"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!edit && <TextField label="Codigo" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />}
            <TextField label="Nombre visible" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
            <TextField label="Multiplicador" type="number" value={form.multiplier} onChange={(e) => setForm((f) => ({ ...f, multiplier: Number(e.target.value) }))} />
            <TextField label="Orden" type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} />
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(_, c) => setForm((f) => ({ ...f, isActive: c }))} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} variant="contained" disabled={saving}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function ComplexitySection({
  rows,
  onChanged,
}: {
  rows: ComplexityLevelListItem[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<ComplexityLevelListItem | null>(null);
  const [form, setForm] = useState({
    code: "",
    displayName: "",
    multiplier: 1,
    isActive: true,
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setEdit(null);
    setForm({ code: "", displayName: "", multiplier: 1, isActive: true, displayOrder: rows.length });
    setOpen(true);
  };

  const startEdit = (row: ComplexityLevelListItem) => {
    setEdit(row);
    setForm({
      code: row.code,
      displayName: row.displayName,
      multiplier: row.multiplier,
      isActive: row.isActive,
      displayOrder: row.displayOrder,
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (edit) {
        await updateComplexityLevel(edit.id, {
          displayName: form.displayName,
          multiplier: form.multiplier,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      } else {
        await createComplexityLevel({
          code: form.code.trim(),
          displayName: form.displayName.trim(),
          multiplier: form.multiplier,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      }
      setOpen(false);
      await onChanged();
    } catch (e) {
      window.alert(extractApiErrorMessage(e, "No fue posible guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Niveles de complejidad</Typography>
        <Button variant="contained" onClick={startCreate}>
          Nuevo
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Codigo</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Multiplicador</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.displayName}</TableCell>
              <TableCell>{row.multiplier}</TableCell>
              <TableCell>{row.isActive ? "Si" : "No"}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => startEdit(row)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit ? "Editar complejidad" : "Nueva complejidad"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!edit && <TextField label="Codigo" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />}
            <TextField label="Nombre visible" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
            <TextField label="Multiplicador" type="number" value={form.multiplier} onChange={(e) => setForm((f) => ({ ...f, multiplier: Number(e.target.value) }))} />
            <TextField label="Orden" type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} />
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(_, c) => setForm((f) => ({ ...f, isActive: c }))} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} variant="contained" disabled={saving}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function VolumeSection({
  rows,
  onChanged,
}: {
  rows: VolumeDiscountRuleListItem[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<VolumeDiscountRuleListItem | null>(null);
  const [form, setForm] = useState({
    minimumCount: 1,
    discountPercent: 0,
    isActive: true,
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setEdit(null);
    setForm({ minimumCount: 1, discountPercent: 0, isActive: true, displayOrder: rows.length });
    setOpen(true);
  };

  const startEdit = (row: VolumeDiscountRuleListItem) => {
    setEdit(row);
    setForm({
      minimumCount: row.minimumCount,
      discountPercent: row.discountPercent,
      isActive: row.isActive,
      displayOrder: row.displayOrder,
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (edit) {
        await updateVolumeDiscountRule(edit.id, {
          minimumCount: form.minimumCount,
          discountPercent: form.discountPercent,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      } else {
        await createVolumeDiscountRule({
          minimumCount: form.minimumCount,
          discountPercent: form.discountPercent,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      }
      setOpen(false);
      await onChanged();
    } catch (e) {
      window.alert(extractApiErrorMessage(e, "No fue posible guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Descuentos por volumen</Typography>
        <Button variant="contained" onClick={startCreate}>
          Nueva regla
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Minimo de solicitudes</TableCell>
            <TableCell>Descuento %</TableCell>
            <TableCell>Orden</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.minimumCount}</TableCell>
              <TableCell>{row.discountPercent}</TableCell>
              <TableCell>{row.displayOrder}</TableCell>
              <TableCell>{row.isActive ? "Si" : "No"}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => startEdit(row)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit ? "Editar regla" : "Nueva regla"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Cantidad minima previa (mismo tipo de unidad)"
              type="number"
              value={form.minimumCount}
              onChange={(e) => setForm((f) => ({ ...f, minimumCount: Number(e.target.value) }))}
            />
            <TextField
              label="Descuento porcentual"
              type="number"
              value={form.discountPercent}
              onChange={(e) => setForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))}
            />
            <TextField label="Orden" type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} />
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(_, c) => setForm((f) => ({ ...f, isActive: c }))} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} variant="contained" disabled={saving}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function NurseSpecialtySection({
  rows,
  onChanged,
}: {
  rows: NurseSpecialtyListItem[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<NurseSpecialtyListItem | null>(null);
  const [form, setForm] = useState({
    code: "",
    displayName: "",
    alternativeCodes: "",
    isActive: true,
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setEdit(null);
    setForm({ code: "", displayName: "", alternativeCodes: "", isActive: true, displayOrder: rows.length });
    setOpen(true);
  };

  const startEdit = (row: NurseSpecialtyListItem) => {
    setEdit(row);
    setForm({
      code: row.code,
      displayName: row.displayName,
      alternativeCodes: row.alternativeCodes ?? "",
      isActive: row.isActive,
      displayOrder: row.displayOrder,
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const alt = form.alternativeCodes.trim() ? form.alternativeCodes.trim() : null;
      if (edit) {
        await updateNurseSpecialty(edit.id, {
          displayName: form.displayName,
          alternativeCodes: alt,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      } else {
        await createNurseSpecialty({
          code: form.code.trim(),
          displayName: form.displayName.trim(),
          alternativeCodes: alt,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      }
      setOpen(false);
      await onChanged();
    } catch (e) {
      window.alert(extractApiErrorMessage(e, "No fue posible guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Especialidades de enfermeria</Typography>
        <Button data-testid="admin-catalog-nurse-category-create-button" variant="contained" onClick={startCreate}>
          Nueva
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Codigo</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Alias</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.displayName}</TableCell>
              <TableCell>{row.alternativeCodes ?? ""}</TableCell>
              <TableCell>{row.isActive ? "Si" : "No"}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => startEdit(row)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit ? "Editar especialidad" : "Nueva especialidad"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!edit && (
              <TextField
                label="Codigo"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                slotProps={{ htmlInput: { "data-testid": "admin-catalog-nurse-category-code-input" } }}
              />
            )}
            <TextField label="Nombre visible" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
            <TextField
              label="Alias (opcional)"
              value={form.alternativeCodes}
              onChange={(e) => setForm((f) => ({ ...f, alternativeCodes: e.target.value }))}
              helperText="Valores alternativos admitidos en texto libre, separados por coma."
            />
            <TextField label="Orden" type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} />
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(_, c) => setForm((f) => ({ ...f, isActive: c }))} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} variant="contained" disabled={saving}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function NurseCategorySection({
  rows,
  onChanged,
}: {
  rows: NurseCategoryListItem[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<NurseCategoryListItem | null>(null);
  const [form, setForm] = useState({
    code: "",
    displayName: "",
    alternativeCodes: "",
    isActive: true,
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setEdit(null);
    setForm({ code: "", displayName: "", alternativeCodes: "", isActive: true, displayOrder: rows.length });
    setOpen(true);
  };

  const startEdit = (row: NurseCategoryListItem) => {
    setEdit(row);
    setForm({
      code: row.code,
      displayName: row.displayName,
      alternativeCodes: row.alternativeCodes ?? "",
      isActive: row.isActive,
      displayOrder: row.displayOrder,
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const alt = form.alternativeCodes.trim() ? form.alternativeCodes.trim() : null;
      if (edit) {
        await updateNurseCategory(edit.id, {
          displayName: form.displayName,
          alternativeCodes: alt,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      } else {
        await createNurseCategory({
          code: form.code.trim(),
          displayName: form.displayName.trim(),
          alternativeCodes: alt,
          isActive: form.isActive,
          displayOrder: form.displayOrder,
        });
      }
      setOpen(false);
      await onChanged();
    } catch (e) {
      window.alert(extractApiErrorMessage(e, "No fue posible guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Categorias de enfermeria</Typography>
        <Button variant="contained" onClick={startCreate}>
          Nueva
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Codigo</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Alias</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.code}</TableCell>
              <TableCell>{row.displayName}</TableCell>
              <TableCell>{row.alternativeCodes ?? ""}</TableCell>
              <TableCell>{row.isActive ? "Si" : "No"}</TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => startEdit(row)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{edit ? "Editar categoria" : "Nueva categoria"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!edit && <TextField label="Codigo" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />}
            <TextField label="Nombre visible" value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
            <TextField label="Alias (opcional)" value={form.alternativeCodes} onChange={(e) => setForm((f) => ({ ...f, alternativeCodes: e.target.value }))} />
            <TextField label="Orden" type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))} />
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(_, c) => setForm((f) => ({ ...f, isActive: c }))} />} label="Activo" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} variant="contained" disabled={saving}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function PricingPreviewPanel({ options }: { options: CatalogOptionsResponse }) {
  const defaultType = options.careRequestTypes[0]?.code ?? "";
  const [careRequestTypeCode, setCareRequestTypeCode] = useState(defaultType);
  const [unit, setUnit] = useState(1);
  const [clientBasePriceOverride, setClientBasePriceOverride] = useState<number | "">("");
  const [distanceFactorCode, setDistanceFactorCode] = useState(options.distanceFactors[0]?.code ?? "local");
  const [complexityLevelCode, setComplexityLevelCode] = useState(options.complexityLevels[0]?.code ?? "estandar");
  const [medicalSuppliesCost, setMedicalSuppliesCost] = useState<number | "">("");
  const [existingSameUnitTypeCount, setExistingSameUnitTypeCount] = useState(0);
  const [useProposedOverrides, setUseProposedOverrides] = useState(false);
  const [proposedCategory, setProposedCategory] = useState<number | "">("");
  const [proposedDistance, setProposedDistance] = useState<number | "">("");
  const [proposedComplexity, setProposedComplexity] = useState<number | "">("");
  const [proposedVolume, setProposedVolume] = useState<number | "">("");
  const [proposedBase, setProposedBase] = useState<number | "">("");
  const [result, setResult] = useState<PricingPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categoryCode = useMemo(
    () => options.careRequestTypes.find((t) => t.code === careRequestTypeCode)?.careRequestCategoryCode,
    [options, careRequestTypeCode],
  );
  const isDomicilio = categoryCode === "domicilio";
  const isHogarOrDomicilio = categoryCode === "hogar" || isDomicilio;
  const isMedicos = categoryCode === "medicos";

  const runPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await previewPricing({
        careRequestTypeCode,
        unit,
        clientBasePriceOverride:
          typeof clientBasePriceOverride === "number" && clientBasePriceOverride > 0
            ? clientBasePriceOverride
            : undefined,
        distanceFactorCode: isDomicilio ? distanceFactorCode : undefined,
        complexityLevelCode: isHogarOrDomicilio ? complexityLevelCode : undefined,
        medicalSuppliesCost:
          isMedicos && typeof medicalSuppliesCost === "number" ? medicalSuppliesCost : undefined,
        existingSameUnitTypeCount,
        useProposedOverrides,
        proposedOverrides: useProposedOverrides
          ? {
              categoryFactor: typeof proposedCategory === "number" ? proposedCategory : undefined,
              distanceMultiplier: typeof proposedDistance === "number" ? proposedDistance : undefined,
              complexityMultiplier: typeof proposedComplexity === "number" ? proposedComplexity : undefined,
              volumeDiscountPercent: typeof proposedVolume === "number" ? proposedVolume : undefined,
              basePrice: typeof proposedBase === "number" ? proposedBase : undefined,
            }
          : undefined,
      });
      setResult(res);
    } catch (e) {
      setResult(null);
      setError(extractApiErrorMessage(e, "Calculo invalido."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Vista previa de precios (servidor)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Calcula con las reglas vigentes en base de datos. Activa la simulacion para sobreescribir multiplicadores puntuales
        antes de publicar cambios en el catalogo.
      </Typography>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          select
          label="Tipo de solicitud"
          value={careRequestTypeCode}
          onChange={(e) => setCareRequestTypeCode(e.target.value)}
          SelectProps={{ native: true }}
        >
          {options.careRequestTypes.map((t) => (
            <option key={t.code} value={t.code}>
              {t.displayName}
            </option>
          ))}
        </TextField>
        <TextField
          label="Unidades"
          type="number"
          value={unit}
          onChange={(e) => setUnit(Math.max(1, Number(e.target.value)))}
          slotProps={{ htmlInput: { "data-testid": "admin-catalog-pricing-preview-unit-input" } }}
        />
        <TextField
          label="Ajuste de precio base (opcional)"
          type="number"
          value={clientBasePriceOverride}
          onChange={(e) => setClientBasePriceOverride(e.target.value === "" ? "" : Number(e.target.value))}
        />
        {isDomicilio && (
          <TextField select label="Distancia" value={distanceFactorCode} onChange={(e) => setDistanceFactorCode(e.target.value)} SelectProps={{ native: true }}>
            {options.distanceFactors.map((d) => (
              <option key={d.code} value={d.code}>
                {d.displayName}
              </option>
            ))}
          </TextField>
        )}
        {isHogarOrDomicilio && (
          <TextField select label="Complejidad" value={complexityLevelCode} onChange={(e) => setComplexityLevelCode(e.target.value)} SelectProps={{ native: true }}>
            {options.complexityLevels.map((c) => (
              <option key={c.code} value={c.code}>
                {c.displayName}
              </option>
            ))}
          </TextField>
        )}
        {isMedicos && (
          <TextField
            label="Insumos medicos"
            type="number"
            value={medicalSuppliesCost}
            onChange={(e) => setMedicalSuppliesCost(e.target.value === "" ? "" : Number(e.target.value))}
          />
        )}
        <TextField
          label="Solicitudes previas mismo tipo de unidad (cliente)"
          type="number"
          value={existingSameUnitTypeCount}
          onChange={(e) => setExistingSameUnitTypeCount(Math.max(0, Number(e.target.value)))}
        />
        <FormControlLabel
          control={<Checkbox checked={useProposedOverrides} onChange={(_, c) => setUseProposedOverrides(c)} />}
          label="Simular multiplicadores propuestos (antes de guardar en catalogo)"
        />
        {useProposedOverrides && (
          <Stack spacing={1.5} sx={{ pl: 1, borderLeft: "3px solid rgba(183,128,60,0.5)" }}>
            <TextField label="Factor categoria propuesto" type="number" value={proposedCategory} onChange={(e) => setProposedCategory(e.target.value === "" ? "" : Number(e.target.value))} />
            <TextField label="Multiplicador distancia propuesto" type="number" value={proposedDistance} onChange={(e) => setProposedDistance(e.target.value === "" ? "" : Number(e.target.value))} />
            <TextField label="Multiplicador complejidad propuesto" type="number" value={proposedComplexity} onChange={(e) => setProposedComplexity(e.target.value === "" ? "" : Number(e.target.value))} />
            <TextField label="Descuento volumen % propuesto" type="number" value={proposedVolume} onChange={(e) => setProposedVolume(e.target.value === "" ? "" : Number(e.target.value))} />
            <TextField label="Precio base propuesto" type="number" value={proposedBase} onChange={(e) => setProposedBase(e.target.value === "" ? "" : Number(e.target.value))} />
          </Stack>
        )}
        <Button data-testid="admin-catalog-pricing-preview-run-button" variant="contained" onClick={() => void runPreview()} disabled={loading}>
          {loading ? "Calculando..." : "Calcular vista previa"}
        </Button>
        {result && (
          <Box data-testid="admin-catalog-pricing-preview-result" sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(247,244,238,0.9)" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Resultado
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2">Tipo de unidad: {result.unitType}</Typography>
              <Typography variant="body2">Categoria: {result.pricingCategoryCode}</Typography>
              <Typography variant="body2">Total: {result.grandTotal.toFixed(2)}</Typography>
              <Typography variant="body2">Descuento volumen: {result.volumeDiscountPercent}%</Typography>
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

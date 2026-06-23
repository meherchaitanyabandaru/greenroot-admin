import ImageIcon from '@mui/icons-material/Image';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import StarIcon from '@mui/icons-material/Star';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCreatePlantImageMutation,
  useGetPlantCareGuideQuery,
  useGetPlantQuery,
  useUpdatePlantMutation,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { DetailSkeleton, LoadingState } from '../../components/feedback/LoadingState';
import { StatusChip } from '../../components/status/StatusChip';
import { normalizeApiError } from '../../utils/apiError';
import { toLabel } from '../../utils/labels';
import { PlantForm } from './PlantForm';
import { PlantImageForm } from './PlantImageForm';

function text(v: unknown) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

function optionalText(v: unknown) {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

function asRows(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      fontSize={11}
      fontWeight={700}
      textTransform="uppercase"
      letterSpacing="0.07em"
      color="text.secondary"
      mb={1.5}
    >
      {children}
    </Typography>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">
        {label}
      </Typography>
      <Typography fontSize={13.5} mt={0.25}>{value}</Typography>
    </Box>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function OverviewTab({ plant }: { plant: Record<string, unknown> }) {
  const categories = asRows(plant.categories);

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <SectionLabel>Details</SectionLabel>
        <Grid container spacing={2}>
          {[
            ['Plant Type', toLabel(String(plant.plant_type ?? ''))],
            ['Light Requirement', toLabel(String(plant.light_requirement ?? ''))],
            ['Water Requirement', toLabel(String(plant.water_requirement ?? ''))],
            ['Is Active', plant.is_active ? 'Yes' : 'No'],
          ].map(([label, value]) => (
            <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
              <DetailRow label={String(label)} value={text(value)} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {Boolean(plant.english_description) && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <SectionLabel>Description</SectionLabel>
          <Typography fontSize={13.5} color="text.secondary" lineHeight={1.7}>
            {text(plant.english_description)}
          </Typography>
        </Paper>
      )}

      {categories.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <SectionLabel>Categories</SectionLabel>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {categories.map((cat) => (
              <Chip
                key={String(cat.id)}
                label={text(cat.name)}
                size="small"
                sx={{ bgcolor: 'primary.50', color: 'primary.dark', fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

function CareGuideTab({ plantId }: { plantId: number }) {
  const careGuideQuery = useGetPlantCareGuideQuery(plantId);
  const careGuide = careGuideQuery.data?.care_guide ?? {};

  if (careGuideQuery.isFetching) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <Skeleton variant="text" width="40%" height={14} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="80%" height={18} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  const hasCareGuide = Object.values(careGuide).some(Boolean);

  if (!hasCareGuide) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <LocalFloristIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary" fontSize={14}>No care guide available for this plant.</Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Grid container spacing={2.5}>
        {[
          ['Sunlight', careGuide.sunlight],
          ['Watering', careGuide.watering],
          ['Soil', careGuide.soil],
          ['Temperature', careGuide.temperature],
          ['Fertilizer', careGuide.fertilizer],
          ['Pruning', careGuide.pruning],
        ].map(([label, value]) => (
          <Grid key={String(label)} size={{ xs: 12, sm: 6 }}>
            <DetailRow label={String(label)} value={text(value)} />
          </Grid>
        ))}
        {Boolean(careGuide.notes) && (
          <Grid size={{ xs: 12 }}>
            <DetailRow label="Notes" value={text(careGuide.notes)} />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}

function ImagesTab({
  plant,
  plantId,
  loading,
  onSubmit,
}: {
  plant: Record<string, unknown>;
  plantId: number;
  loading: boolean;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}) {
  const images = asRows(plant.images);

  return (
    <Stack spacing={2}>
      {images.length > 0 ? (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <SectionLabel>Gallery ({images.length} images)</SectionLabel>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {images.map((image) => (
              <Box
                key={String(image.id)}
                sx={{
                  position: 'relative',
                  width: 90,
                  height: 90,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '2px solid',
                  borderColor: image.is_primary ? 'primary.main' : 'divider',
                  bgcolor: 'primary.50',
                  flexShrink: 0,
                }}
              >
                <Box
                  component="img"
                  src={String(image.image_url)}
                  alt={text(image.alt_text)}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                {Boolean(image.is_primary) && (
                  <Tooltip title="Primary image">
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <StarIcon sx={{ fontSize: 11, color: '#fff' }} />
                    </Box>
                  </Tooltip>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <ImageIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary" fontSize={13}>No images uploaded yet.</Typography>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <SectionLabel>Upload New Image</SectionLabel>
        <PlantImageForm loading={loading} onSubmit={onSubmit} />
      </Paper>
    </Stack>
  );
}

function InventoryPreviewTab({ plant }: { plant: Record<string, unknown> }) {
  const inventory = asRows(plant.inventory ?? []);

  const stockConfig: Record<string, { label: string; color: string; bg: string }> = {
    AVAILABLE:    { label: 'In Stock',   color: '#17803D', bg: '#D1FAE5' },
    LOW_STOCK:    { label: 'Low Stock',  color: '#B7791F', bg: '#FEF3C7' },
    OUT_OF_STOCK: { label: 'No Stock',   color: '#C2410C', bg: '#FEE2E2' },
    RESERVED:     { label: 'Reserved',   color: '#2563EB', bg: '#DBEAFE' },
    DISCONTINUED: { label: 'Discontinued', color: '#667085', bg: '#F2F4F7' },
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nursery</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {inventory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} sx={{ border: 0, py: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" fontSize={13}>No inventory records for this plant.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            inventory.map((item, i) => {
              const s = String(item.inventory_status ?? '').toUpperCase();
              const cfg = stockConfig[s] ?? { label: s || '—', color: '#667085', bg: '#F2F4F7' };
              const qty = Number(item.available_quantity ?? 0);
              return (
                <TableRow key={i}>
                  <TableCell>
                    <Typography fontSize={13.5} fontWeight={500}>{text(item.nursery_name ?? item.nursery_id)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13.5} color="text.secondary">
                      {text(item.size_name ?? item.size_code ?? item.size_id)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13.5} fontWeight={600}>{qty}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cfg.label}
                      size="small"
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        height: 22,
                        bgcolor: cfg.bg,
                        color: cfg.color,
                        border: 'none',
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

function EditTab({
  plant,
  plantId,
  loading,
  onSubmit,
}: {
  plant: Record<string, unknown>;
  plantId: number;
  loading: boolean;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}) {
  const careGuideQuery = useGetPlantCareGuideQuery(plantId);
  const careGuide = careGuideQuery.data?.care_guide ?? {};
  const categories = asRows(plant.categories);

  const formInitial = {
    ...plant,
    categories,
    scientific_name: optionalText(plant.scientific_name),
    common_name: optionalText(plant.common_name),
    english_description: optionalText(plant.english_description),
    plant_type: optionalText(plant.plant_type),
    light_requirement: optionalText(plant.light_requirement),
    water_requirement: optionalText(plant.water_requirement),
    sunlight: optionalText(careGuide.sunlight),
    watering: optionalText(careGuide.watering),
    soil: optionalText(careGuide.soil),
    temperature: optionalText(careGuide.temperature),
    fertilizer: optionalText(careGuide.fertilizer),
    pruning: optionalText(careGuide.pruning),
    care_notes: optionalText(careGuide.notes),
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <PlantForm initial={formInitial} loading={loading} onSubmit={onSubmit} />
    </Paper>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Care Guide', 'Images', 'Inventory', 'Edit'];

export function PlantDetailPanel({ plantId }: { plantId: number }) {
  const plantQuery = useGetPlantQuery(plantId);
  const [updatePlant, updatePlantState] = useUpdatePlantMutation();
  const [createImage, createImageState] = useCreatePlantImageMutation();
  const [tab, setTab] = useState(0);

  if (plantQuery.isLoading) return <DetailSkeleton />;
  if (plantQuery.error)
    return (
      <ErrorState
        message={normalizeApiError(plantQuery.error).message}
        onRetry={plantQuery.refetch}
      />
    );

  const plant = plantQuery.data?.plant ?? {};
  const images = asRows(plant.images);
  const primaryImage = images.find((img) => img.is_primary) ?? images[0];

  async function submitPlant(values: Record<string, unknown>) {
    await updatePlant({ id: plantId, body: values }).unwrap();
  }

  async function submitImage(values: Record<string, unknown>) {
    await createImage({ id: plantId, body: values }).unwrap();
  }

  return (
    <Stack spacing={2.5}>
      {(updatePlantState.isError || createImageState.isError) && (
        <Alert severity="error">
          {normalizeApiError(updatePlantState.error || createImageState.error).message}
        </Alert>
      )}

      {/* ── Header card ── */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
          {/* Thumbnail */}
          <Box
            sx={{
              width: { xs: '100%', sm: 112 },
              height: { xs: 140, sm: 112 },
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'primary.50',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {primaryImage?.image_url ? (
              <Box
                component="img"
                src={String(primaryImage.image_url)}
                alt={text(primaryImage.alt_text || plant.common_name)}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Stack alignItems="center" spacing={0.5}>
                <ImageIcon sx={{ fontSize: 32, color: 'primary.200' }} />
                <Typography fontSize={10} color="text.disabled">No image</Typography>
              </Stack>
            )}
          </Box>

          {/* Info */}
          <Stack spacing={1} flex={1} minWidth={0}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
              <Box minWidth={0}>
                <Typography fontSize={11} fontWeight={700} textTransform="uppercase" letterSpacing="0.06em" color="text.secondary" mb={0.25}>
                  Plant
                </Typography>
                <Typography variant="h6" fontWeight={700} noWrap>
                  {text(plant.common_name || plant.scientific_name)}
                </Typography>
                {Boolean(plant.scientific_name) && (
                  <Typography fontSize={13} color="text.secondary" fontStyle="italic">
                    {text(plant.scientific_name)}
                  </Typography>
                )}
              </Box>
              <StatusChip value={plant.is_active === false ? 'INACTIVE' : 'ACTIVE'} />
            </Stack>

            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {Boolean(plant.plant_type) && (
                <Chip label={toLabel(String(plant.plant_type))} size="small" variant="outlined" />
              )}
              {Boolean(plant.light_requirement) && (
                <Chip label={`☀ ${toLabel(String(plant.light_requirement))}`} size="small" variant="outlined" />
              )}
              {Boolean(plant.water_requirement) && (
                <Chip label={`💧 ${toLabel(String(plant.water_requirement))}`} size="small" variant="outlined" />
              )}
              {images.length > 0 && (
                <Chip label={`${images.length} photo${images.length > 1 ? 's' : ''}`} size="small" variant="outlined" />
              )}
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {/* ── Tabs ── */}
      <Box>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5, minHeight: 40 }}
          TabIndicatorProps={{ style: { height: 2 } }}
        >
          {TABS.map((label) => (
            <Tab
              key={label}
              label={label}
              sx={{ minHeight: 40, fontSize: 13, textTransform: 'none', fontWeight: 600 }}
            />
          ))}
        </Tabs>

        {tab === 0 && <OverviewTab plant={plant} />}
        {tab === 1 && <CareGuideTab plantId={plantId} />}
        {tab === 2 && (
          <ImagesTab
            plant={plant}
            plantId={plantId}
            loading={createImageState.isLoading}
            onSubmit={submitImage}
          />
        )}
        {tab === 3 && <InventoryPreviewTab plant={plant} />}
        {tab === 4 && (
          <EditTab
            plant={plant}
            plantId={plantId}
            loading={updatePlantState.isLoading}
            onSubmit={submitPlant}
          />
        )}
      </Box>
    </Stack>
  );
}

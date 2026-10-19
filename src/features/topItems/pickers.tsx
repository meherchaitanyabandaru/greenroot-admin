import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  type PlantLookupResult,
  useListResourceQuery,
  useLookupPlantsQuery,
  useResolvePlantMutation,
} from '../../api/adminResources';

export type Picked = { id: number; label: string };

function useDebounced(value: string, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Nursery search for thousands of nurseries: asks the API (20 at a time)
 * instead of loading every nursery into a dropdown.
 */
export function NurseryPicker({
  value,
  onChange,
  label = 'Nursery',
  error,
  disabled,
}: {
  value: Picked | null;
  onChange: (v: Picked | null) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}) {
  const [input, setInput] = useState('');
  const search = useDebounced(input);
  const { data, isFetching } = useListResourceQuery({ resource: 'nurseries', params: { page: 1, per_page: 20, search } });
  const options: Picked[] = (data?.rows ?? []).map((n) => ({
    id: Number(n.id),
    label: `${String(n.name ?? `Nursery #${String(n.id)}`)}${n.nursery_code ? ` · ${String(n.nursery_code)}` : ''}`,
  }));
  return (
    <Autocomplete
      size="small"
      sx={{ minWidth: 260 }}
      disabled={disabled}
      options={options}
      value={value}
      filterOptions={(o) => o}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={isFetching}
      onInputChange={(_, v, reason) => reason === 'input' && setInput(v)}
      onChange={(_, v) => onChange(v)}
      noOptionsText={search ? 'No nursery matches' : 'Type a nursery name or code'}
      renderInput={(params) => <TextField {...params} label={label} error={!!error} helperText={error} placeholder="Search nurseries" />}
    />
  );
}

type PlantOption = PlantLookupResult & { key: string; label: string; sub: string };

/**
 * Plant search over the catalog and the 1.66 M botanical names. Picking a
 * botanical name adds it to the catalog first (resolve), so the result is
 * always a catalog plant id.
 */
export function PlantPicker({
  value,
  onChange,
  label = 'Plant',
  error,
}: {
  value: Picked | null;
  onChange: (v: Picked | null) => void;
  label?: string;
  error?: string;
}) {
  const [input, setInput] = useState('');
  const query = useDebounced(input);
  const lookup = useLookupPlantsQuery(query, { skip: query.length < 2 });
  const [resolvePlant, resolveState] = useResolvePlantMutation();
  const [resolveError, setResolveError] = useState('');
  const options: PlantOption[] = (query.length < 2 ? [] : lookup.data?.results ?? []).map((r) =>
    r.plant
      ? {
          ...r,
          key: `plant-${String(r.plant.id)}`,
          label: String(r.plant.common_name || r.plant.scientific_name),
          sub: String(r.plant.common_name ? r.plant.scientific_name : r.plant.plant_code ?? ''),
        }
      : { ...r, key: r.name!.wfo_id, label: r.name!.scientific_name, sub: [r.name!.family, 'botanical name'].filter(Boolean).join(' · ') },
  );

  async function pick(o: PlantOption | null) {
    setResolveError('');
    if (!o) return onChange(null);
    if (o.plant) return onChange({ id: Number(o.plant.id), label: o.label });
    try {
      const res = await resolvePlant(o.name!.wfo_id).unwrap();
      const plant = (res as { plant: Record<string, unknown> }).plant;
      onChange({ id: Number(plant.id), label: String(plant.common_name || plant.scientific_name) });
    } catch {
      setResolveError('Could not add this name to the catalog');
    }
  }

  return (
    <Autocomplete<PlantOption | Picked, false, false, false>
      size="small"
      sx={{ minWidth: 260 }}
      options={options}
      value={value}
      filterOptions={(o) => o}
      getOptionKey={(o) => ('key' in o ? o.key : `picked-${o.id}`)}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(a, b) => ('id' in a && 'id' in b ? a.id === b.id : a.label === b.label)}
      loading={lookup.isFetching || resolveState.isLoading}
      onInputChange={(_, v, reason) => reason === 'input' && setInput(v)}
      onChange={(_, o) => void pick(o && 'key' in o ? o : null)}
      noOptionsText={query.length < 2 ? 'Type 2+ letters' : 'No plant matches'}
      renderOption={(props, o) => {
        const { key, ...rest } = props;
        return (
          <Box component="li" key={key} {...rest}>
            <Box>
              <Typography fontSize={14}>{o.label}</Typography>
              {'sub' in o && <Typography fontSize={12} color="text.secondary" fontStyle="italic">{o.sub}</Typography>}
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} error={!!(error || resolveError)} helperText={error || resolveError} placeholder="Common or scientific name" />
      )}
    />
  );
}

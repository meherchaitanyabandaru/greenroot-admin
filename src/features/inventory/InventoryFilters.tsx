import { Autocomplete, MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useListResourceQuery, useLookupPlantsQuery } from '../../api/adminResources';

/**
 * Inventory filters by name instead of database ids: a nursery dropdown and a
 * catalog-plant search (only catalog plants can be stocked).
 */
export function InventoryFilters({
  nurseryId,
  plantId,
  onNurseryChange,
  onPlantChange,
}: {
  nurseryId: string;
  plantId: string;
  onNurseryChange: (id: string) => void;
  onPlantChange: (id: string) => void;
}) {
  const nurseries = useListResourceQuery({ resource: 'nurseries', params: { page: 1, per_page: 100 } });
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ id: string; label: string } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);
  const lookup = useLookupPlantsQuery(query, { skip: query.length < 2 });
  const options = (lookup.data?.results ?? [])
    .filter((r) => r.plant)
    .map((r) => ({
      id: String(r.plant!.id),
      label: [r.plant!.common_name, r.plant!.scientific_name].filter(Boolean).map(String).join(' · '),
    }));

  return (
    <>
      <TextField select label="Nursery" size="small" sx={{ minWidth: 200 }} value={nurseryId} onChange={(e) => onNurseryChange(e.target.value)}>
        <MenuItem value="">All nurseries</MenuItem>
        {(nurseries.data?.rows ?? []).map((n) => (
          <MenuItem key={String(n.id)} value={String(n.id)}>
            {String(n.name ?? n.nursery_name ?? `Nursery #${String(n.id)}`)}
          </MenuItem>
        ))}
      </TextField>
      <Autocomplete
        size="small"
        sx={{ minWidth: 240 }}
        options={options}
        value={plantId ? selected : null}
        inputValue={input}
        filterOptions={(o) => o}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        loading={lookup.isFetching}
        noOptionsText={query.length < 2 ? 'Type 2+ letters' : 'No catalog plant matches'}
        onInputChange={(_, v) => setInput(v)}
        onChange={(_, option) => {
          setSelected(option);
          onPlantChange(option?.id ?? '');
        }}
        renderInput={(params) => <TextField {...params} label="Plant" placeholder="Search catalog plants" />}
      />
    </>
  );
}

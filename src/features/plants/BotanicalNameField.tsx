import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { type PlantLookupResult, useLookupPlantsQuery } from '../../api/adminResources';
import { pickedName } from './botanicalName';

/** Botanical names are only searched from 3 characters (API rule). */
const MIN_QUERY = 3;

type Option = PlantLookupResult & { key: string; label: string };

function toOptions(results: PlantLookupResult[]): Option[] {
  return results.map((r) =>
    r.plant
      ? { ...r, key: `plant-${String(r.plant.id)}`, label: String(r.plant.scientific_name ?? '') }
      : { ...r, key: r.name!.wfo_id, label: r.name!.scientific_name },
  );
}

/**
 * Scientific-name input backed by the 1.66 M World Flora Online names.
 * Picking a name sets both the name and its wfo_id; typing a name by hand
 * clears wfo_id (the plant is then unlinked). Plants already in the catalog
 * are listed but disabled, so admins do not create duplicates.
 */
export function BotanicalNameField({
  value,
  wfoId,
  error,
  onChange,
}: {
  value: string;
  wfoId: string;
  error?: string;
  onChange: (scientificName: string, wfoId: string) => void;
}) {
  const [input, setInput] = useState(value);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const lookup = useLookupPlantsQuery(query, { skip: query.length < MIN_QUERY });
  const options = query.length < MIN_QUERY ? [] : toOptions(lookup.data?.results ?? []);

  return (
    <Autocomplete<Option, false, false, true>
      freeSolo
      options={options}
      filterOptions={(o) => o}
      getOptionKey={(o) => (typeof o === 'string' ? o : o.key)}
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
      getOptionDisabled={(o) => Boolean(o.plant)}
      loading={lookup.isFetching}
      inputValue={input}
      onInputChange={(_, next, reason) => {
        setInput(next);
        if (reason === 'input') onChange(next, '');
      }}
      onChange={(_, option) => {
        if (option && typeof option !== 'string' && option.name) {
          const picked = pickedName(option.name);
          setInput(picked.scientificName);
          onChange(picked.scientificName, picked.wfoId);
        }
      }}
      renderOption={(props, o) => {
        const { key, ...rest } = props;
        return (
          <Box component="li" key={key} {...rest}>
            <Box>
              <Typography fontSize={14} fontStyle="italic">
                {o.label}
                {o.name?.authorship ? <Typography component="span" fontSize={12} color="text.secondary" fontStyle="normal"> {o.name.authorship}</Typography> : null}
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                {o.plant
                  ? `Already in catalog · ${String(o.plant.plant_code ?? '')}${o.plant.common_name ? ` · ${String(o.plant.common_name)}` : ''}`
                  : o.name?.accepted_name
                    ? `Synonym — saves as ${o.name.accepted_name}`
                    : [o.name?.family, o.name?.status === 'UNCHECKED' ? 'unchecked name' : null].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="scientific name"
          error={!!error}
          helperText={error ?? (wfoId ? `World Flora Online: ${wfoId}` : 'Type 3+ letters to search botanical names, or enter a name by hand (not linked)')}
        />
      )}
    />
  );
}

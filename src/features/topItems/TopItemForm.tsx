import { Alert, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { type TopItem, type TopItemInput, useListPlantSizesQuery } from '../../api/adminResources';
import { NurseryPicker, type Picked, PlantPicker } from './pickers';

const MAX_PHOTOS = 5;
const MAX_NOTES = 500;

/**
 * Add or edit one top item. An item never moves to another nursery, so the
 * nursery is chosen only when adding.
 */
export function TopItemForm({
  item,
  nursery,
  loading,
  error,
  onSubmit,
}: {
  item?: TopItem;
  nursery: Picked | null;
  loading?: boolean;
  error?: string;
  onSubmit: (body: TopItemInput) => void;
}) {
  const sizes = useListPlantSizesQuery();
  const [pickedNursery, setPickedNursery] = useState<Picked | null>(item ? { id: item.nursery_id, label: item.nursery_name } : nursery);
  const [plant, setPlant] = useState<Picked | null>(item ? { id: item.plant_id, label: item.common_name || item.scientific_name } : null);
  const [sizeId, setSizeId] = useState(item ? String(item.size_id) : '');
  const [price, setPrice] = useState(item?.unit_price != null ? String(item.unit_price) : '');
  const [order, setOrder] = useState(item ? String(item.display_order) : '');
  const [notes, setNotes] = useState(item?.quality_notes ?? '');
  const [photos, setPhotos] = useState((item?.photos ?? []).join('\n'));
  const [touched, setTouched] = useState(false);

  const photoList = photos.split('\n').map((p) => p.trim()).filter(Boolean);
  const priceNum = price === '' ? null : Number(price);
  const orderNum = order === '' ? undefined : Number(order);
  const problems = {
    nursery: !pickedNursery ? 'Choose a nursery' : '',
    plant: !plant ? 'Choose a plant' : '',
    size: !sizeId ? 'Choose a size' : '',
    price: priceNum !== null && (!Number.isFinite(priceNum) || priceNum < 0) ? 'Price must be 0 or more' : '',
    order: orderNum !== undefined && (!Number.isInteger(orderNum) || orderNum < 0 || orderNum > 19) ? 'Position 0–19' : '',
    notes: notes.length > MAX_NOTES ? `At most ${MAX_NOTES} characters` : '',
    photos: photoList.length > MAX_PHOTOS ? `At most ${MAX_PHOTOS} photos` : '',
  };
  const invalid = Object.values(problems).some(Boolean);
  const show = (k: keyof typeof problems) => (touched ? problems[k] : '');

  function submit() {
    setTouched(true);
    if (invalid) return;
    onSubmit({
      ...(item ? {} : { nursery_id: pickedNursery!.id }),
      plant_id: plant!.id,
      size_id: Number(sizeId),
      unit_price: priceNum,
      display_order: orderNum,
      quality_notes: notes.trim() || null,
      photos: photoList,
    });
  }

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <NurseryPicker value={pickedNursery} onChange={setPickedNursery} disabled={!!item} error={show('nursery')} />
      <PlantPicker value={plant} onChange={setPlant} error={show('plant')} />
      <TextField select size="small" label="Size" value={sizeId} onChange={(e) => setSizeId(e.target.value)} error={!!show('size')} helperText={show('size')}>
        {(sizes.data?.sizes ?? []).map((s) => (
          <MenuItem key={s.id} value={String(s.id)}>{s.display_name}</MenuItem>
        ))}
      </TextField>
      <Stack direction="row" spacing={1.5}>
        <TextField
          size="small"
          label="Indicative price (optional)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={!!show('price')}
          helperText={show('price') || 'Per plant'}
          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
          inputProps={{ inputMode: 'decimal' }}
          fullWidth
        />
        <TextField
          size="small"
          label="Position"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          error={!!show('order')}
          helperText={show('order') || (item ? '0 = first' : 'Empty = last')}
          inputProps={{ inputMode: 'numeric' }}
          sx={{ width: 150, flexShrink: 0 }}
        />
      </Stack>
      <TextField
        size="small"
        label="Quality notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        error={!!show('notes')}
        helperText={show('notes') || `${notes.length}/${MAX_NOTES}`}
        multiline
        minRows={2}
      />
      <TextField
        size="small"
        label="Photo links (optional)"
        value={photos}
        onChange={(e) => setPhotos(e.target.value)}
        error={!!show('photos')}
        helperText={show('photos') || `One link per line, up to ${MAX_PHOTOS}`}
        multiline
        minRows={2}
      />
      <Typography fontSize={12} color="text.secondary">
        Top items are the nursery's showcase — what it is known for. They are not stock; orders never change them.
      </Typography>
      <Button variant="contained" disabled={loading} onClick={submit}>
        {item ? 'Save changes' : 'Add top item'}
      </Button>
    </Stack>
  );
}

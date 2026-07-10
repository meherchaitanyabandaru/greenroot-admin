import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import { usePresignUploadMutation, useCreateAttachmentMutation } from '../../api/adminResources';
import { normalizeApiError } from '../../utils/apiError';

const ENTITY_TYPES = [
  'ORDER',
  'DISPATCH',
  'NURSERY',
  'PLANT',
  'INVENTORY',
  'USER',
  'VEHICLE',
  'DRIVER',
  'QUOTATION',
  'PAYMENT',
];

export function AttachmentUploadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [entityType, setEntityType] = useState('ORDER');
  const [entityId, setEntityId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [presign] = usePresignUploadMutation();
  const [createAttachment, createState] = useCreateAttachmentMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !entityId) return;
    setError('');
    setDone(false);
    setProgress(0);

    try {
      // Step 1: Get presigned PUT URL
      const presignResult = await presign({
        bucket: 'attachments',
        file_name: file.name,
        content_type: file.type || 'application/octet-stream',
      }).unwrap();

      // Step 2: PUT file directly to storage
      setProgress(30);
      const putResp = await fetch(presignResult.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!putResp.ok) throw new Error(`Upload failed: ${putResp.statusText}`);
      setProgress(80);

      // Step 3: Save attachment metadata
      await createAttachment({
        entity_type: entityType,
        entity_id: Number(entityId),
        file_name: file.name,
        file_url: presignResult.file_url,
        file_type: file.type || undefined,
        file_size: file.size,
      }).unwrap();

      setProgress(100);
      setDone(true);
      setFile(null);
      setEntityId('');
      if (fileRef.current) fileRef.current.value = '';
      onSuccess?.();
    } catch (e) {
      setError(normalizeApiError(e).message);
      setProgress(null);
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      {done && <Alert severity="success">Attachment uploaded successfully.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        select
        label="Entity Type"
        value={entityType}
        onChange={(e) => setEntityType(e.target.value)}
        size="small"
        required
      >
        {ENTITY_TYPES.map((t) => (
          <MenuItem key={t} value={t}>{t}</MenuItem>
        ))}
      </TextField>

      <TextField
        label="Entity ID"
        value={entityId}
        onChange={(e) => setEntityId(e.target.value)}
        size="small"
        type="number"
        required
        inputProps={{ min: 1 }}
        helperText="Numeric ID of the record this file is attached to."
      />

      <Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          File
        </Typography>
        <input
          ref={fileRef}
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ display: 'block' }}
        />
        {file && (
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </Typography>
        )}
      </Box>

      {progress !== null && (
        <LinearProgress variant="determinate" value={progress} />
      )}

      <Button
        type="submit"
        variant="contained"
        size="small"
        startIcon={<CloudUploadIcon fontSize="small" />}
        disabled={!file || !entityId || createState.isLoading || progress !== null && progress < 100}
        sx={{ alignSelf: 'flex-start' }}
      >
        Upload Attachment
      </Button>
    </Stack>
  );
}

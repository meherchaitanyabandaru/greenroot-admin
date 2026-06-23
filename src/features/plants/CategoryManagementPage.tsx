import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import {
  Alert,
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCreatePlantCategoryMutation,
  useDeletePlantCategoryMutation,
  useListPlantCategoriesQuery,
  useUpdatePlantCategoryMutation,
} from '../../api/adminResources';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { PageHeader } from '../../components/page/PageHeader';
import { normalizeApiError } from '../../utils/apiError';

export function CategoryManagementPage() {
  const { data, isLoading, error, refetch } = useListPlantCategoriesQuery();
  const [createCategory, createState] = useCreatePlantCategoryMutation();
  const [updateCategory, updateState] = useUpdatePlantCategoryMutation();
  const [deleteCategory] = useDeletePlantCategoryMutation();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const categories = data?.categories ?? [];

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    await createCategory({ name }).unwrap();
    setNewName('');
  }

  function startEdit(id: number, name: string) {
    setEditingId(id);
    setEditingName(name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
  }

  async function handleUpdate(id: number) {
    const name = editingName.trim();
    if (!name) return;
    await updateCategory({ id, body: { name } }).unwrap();
    cancelEdit();
  }

  async function handleToggle(id: number, currentActive: boolean) {
    await updateCategory({ id, body: { is_active: !currentActive } }).unwrap();
  }

  const mutationError = createState.error || updateState.error;

  return (
    <Box>
      <PageHeader
        title="Plant Categories"
        description="Create, rename, and activate/deactivate plant categories."
      />

      {mutationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {normalizeApiError(mutationError).message}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <TextField
            label="New category name"
            size="small"
            sx={{ flex: 1, maxWidth: 360 }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
          <Tooltip title="Add category">
            <span>
              <IconButton
                color="primary"
                disabled={!newName.trim() || createState.isLoading}
                onClick={handleCreate}
                size="small"
              >
                <AddIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {isLoading && <LoadingState />}
        {error && <ErrorState message={normalizeApiError(error).message} onRetry={refetch} />}
        {!isLoading && !error && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary" variant="body2">
                      No categories yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {categories.map((cat) => {
                const id = Number(cat.id);
                const name = String(cat.name);
                const isActive = Boolean(cat.is_active);
                const isEditing = editingId === id;
                return (
                  <TableRow key={id} sx={{ opacity: isActive ? 1 : 0.5 }}>
                    <TableCell>
                      <Typography color="text.secondary" variant="caption">
                        {id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          autoFocus
                          size="small"
                          sx={{ minWidth: 200 }}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate(id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                      ) : (
                        <Typography variant="body2">{name}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={isActive ? 'success' : 'default'}
                        label={isActive ? 'Active' : 'Inactive'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Save">
                            <IconButton onClick={() => handleUpdate(id)} size="small">
                              <CheckIcon fontSize="small" color="success" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton onClick={cancelEdit} size="small">
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Rename">
                            <IconButton onClick={() => startEdit(id, name)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isActive ? 'Deactivate' : 'Activate'}>
                            <IconButton onClick={() => handleToggle(id, isActive)} size="small">
                              <PowerSettingsNewIcon
                                fontSize="small"
                                color={isActive ? 'warning' : 'success'}
                              />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}

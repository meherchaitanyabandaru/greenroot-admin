import { Alert, Button, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingState } from '../components/feedback/LoadingState';
import { useMeQuery } from '../features/auth/authApi';
import { clearAuth, setCurrentUser } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../hooks/redux';

export function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.accessToken);
  const { data, isLoading, isError } = useMeQuery(undefined, { skip: !token });
  const user = data?.user;

  useEffect(() => {
    if (user) dispatch(setCurrentUser(user));
  }, [dispatch, user]);

  if (!token) return <Navigate replace to="/login" />;
  if (isLoading) return <LoadingState label="Checking admin session" />;
  if (isError) return <Navigate replace to="/login" />;

  const isAdmin = user?.roles?.some(r => r.code === 'ADMIN');

  if (!isAdmin) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 560, mx: 'auto', mt: 12 }}>
        <Typography variant="h4">Access Denied</Typography>
        <Alert severity="warning">This portal is for GreenRoot ADMIN users only.</Alert>
        <Button
          onClick={() => dispatch(clearAuth())}
          sx={{ alignSelf: 'flex-start' }}
          variant="contained"
        >
          Back to login
        </Button>
      </Stack>
    );
  }

  return <Outlet />;
}

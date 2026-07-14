import { zodResolver } from '@hookform/resolvers/zod';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { normalizeApiError } from '../../utils/apiError';
import { useSendOtpMutation, useVerifyOtpMutation } from './authApi';
import { setCredentials } from './authSlice';
import { useAppDispatch } from '../../hooks/redux';

const schema = z.object({
  mobile: z.string().min(10, 'Enter a valid mobile number'),
  otp: z.string().min(6, 'OTP is required'),
});

type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [sendOtp, sendState] = useSendOtpMutation();
  const [verifyOtp, verifyState] = useVerifyOtpMutation();
  const { control, handleSubmit, getValues } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { mobile: '9000000000', otp: '123456' },
  });

  async function handleSendOtp() {
    await sendOtp({ mobile: getValues('mobile') });
  }

  async function onSubmit(values: LoginForm) {
    const result = await verifyOtp(values).unwrap();
    dispatch(
      setCredentials({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        user: result.user,
      }),
    );
    navigate('/', { replace: true });
  }

  const error = normalizeApiError(sendState.error || verifyState.error);

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          sx={{
            width: 42,
            height: 42,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: '#fff',
          }}
        >
          <LocalFloristIcon />
        </Box>
        <Box>
          <Typography variant="h5">GreenRoot</Typography>
          <Typography color="text.secondary" variant="body2">
            Admin Operations
          </Typography>
        </Box>
      </Stack>

      <Box>
        <Typography variant="h5">Welcome back</Typography>
        <Typography color="text.secondary" variant="body2">
          Sign in with admin mobile and OTP.
        </Typography>
      </Box>

      {(sendState.isError || verifyState.isError) && <Alert severity="error">{error.message}</Alert>}
      {sendState.isSuccess && <Alert severity="success">OTP sent. Use 123456 for local dev.</Alert>}

      <Stack component="form" onSubmit={handleSubmit((values) => onSubmit(values))} spacing={2.25}>
        <Controller
          control={control}
          name="mobile"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              fullWidth
              helperText={fieldState.error?.message}
              label="Admin mobile"
            />
          )}
        />
        <Controller
          control={control}
          name="otp"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              fullWidth
              helperText={fieldState.error?.message}
              label="OTP"
            />
          )}
        />
        <Stack direction="row" spacing={1.5}>
          <Button disabled={sendState.isLoading} onClick={handleSendOtp} variant="outlined">
            Send OTP
          </Button>
          <Button disabled={verifyState.isLoading} fullWidth type="submit" variant="contained">
            Sign in
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

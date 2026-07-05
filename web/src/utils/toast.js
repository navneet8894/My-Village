import toast from 'react-hot-toast';

const baseStyle = {
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '500',
  maxWidth: '360px',
};

const options = {
  duration: 3500,
  style: baseStyle,
};

export const Toast = {
  success(message) {
    return toast.success(message, {
      ...options,
      style: { ...baseStyle, background: '#ecfdf5', color: '#047857' },
    });
  },
  error(message) {
    return toast.error(message, {
      ...options,
      style: { ...baseStyle, background: '#fef2f2', color: '#b91c1c' },
    });
  },
  info(message) {
    return toast(message, {
      ...options,
      style: { ...baseStyle, background: '#f8fafc', color: '#334155' },
    });
  },
};

export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  if (err?.data?.message) return err.data.message;
  if (err?.data?.errors?.[0]?.msg) return err.data.errors[0].msg;
  if (err?.message) return err.message;
  return fallback;
}

export default Toast;

import { Alert, Platform, ToastAndroid } from 'react-native';

function show(message, type = 'info') {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  const title = type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'MY VILLAGE';
  Alert.alert(title, message);
}

export const Toast = {
  success: (message) => show(message, 'success'),
  error: (message) => show(message, 'error'),
  info: (message) => show(message, 'info'),
};

export default Toast;

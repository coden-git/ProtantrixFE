import Constants from 'expo-constants';

const { expoConfig } = Constants;
const extra = (expoConfig && expoConfig.extra) || (Constants.manifest && Constants.manifest.extra) || {};

const BACKEND_URL = extra.BACKEND_URL || 'http://localhost:3000/api';

export {
  BACKEND_URL,
};

const required = (name) => {
  const value = import.meta.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Add it to frontend/.env.`);
  }
  return value;
};

const normalizedUrl = (name) => required(name).replace(/\/+$/, '');

export const API_BASE_URL = normalizedUrl('VITE_API_URL');
export const ASSET_BASE_URL = normalizedUrl('VITE_ASSET_URL');
export const APP_URL = normalizedUrl('VITE_APP_URL');
export const APP_NAME = required('VITE_APP_NAME');

const configuredTimeout = Number(required('VITE_API_TIMEOUT'));
if (!Number.isFinite(configuredTimeout) || configuredTimeout < 1000) {
  throw new Error('VITE_API_TIMEOUT must be a number of at least 1000 milliseconds.');
}
export const API_TIMEOUT = configuredTimeout;

export const SEND_CREDENTIALS = required('VITE_API_WITH_CREDENTIALS').toLowerCase() !== 'false';

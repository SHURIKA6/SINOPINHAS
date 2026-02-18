/**
 * Utilitários para logging e debugging
 */

const isDevelopment = __DEV__;

export const log = {
  info: (tag, message, data) => {
    if (isDevelopment) {
      console.log(`[${tag}] ${message}`, data || '');
    }
  },
  error: (tag, message, error) => {
    if (isDevelopment || !isDevelopment) {
      console.error(`[${tag}] ${message}`, error || '');
    }
  },
  warn: (tag, message, data) => {
    if (isDevelopment) {
      console.warn(`[${tag}] ${message}`, data || '');
    }
  },
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatViewCount = (count) => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
};

export const MASTER_PASSWORD = 'ORAGE2025';

export function checkMasterAuth(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('csuite_auth') === 'authenticated';
}

export function setMasterAuth() {
  localStorage.setItem('csuite_auth', 'authenticated');
}

export function clearMasterAuth() {
  localStorage.removeItem('csuite_auth');
}

export function generateClientId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `OAA-${timestamp}-${random}`;
}

// Local storage keys
const STORAGE_KEYS = {
  TECHNICIAN: 'autotech_technician'
} as const;

export const getTechnicianName = (): string | null => {
  // Check URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  const techFromUrl = urlParams.get('tech');
  
  if (techFromUrl) {
    // Save to localStorage for future use
    localStorage.setItem(STORAGE_KEYS.TECHNICIAN, techFromUrl);
    return techFromUrl;
  }
  
  // Fall back to localStorage
  return localStorage.getItem(STORAGE_KEYS.TECHNICIAN);
};

export const saveTechnicianName = (name: string): void => {
  localStorage.setItem(STORAGE_KEYS.TECHNICIAN, name);
};
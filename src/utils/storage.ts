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

export const uploadFile = async (file: File): Promise<{ fileId: string; fileName: string }> => {
  try {
    // Generate a unique file ID using timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileId = `${timestamp}-${randomString}`;
    
    // Store the original filename
    const fileName = file.name;
    
    // Return the file ID and name
    // Note: In a real application, you would typically upload the file to a storage service here
    return { fileId, fileName };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};
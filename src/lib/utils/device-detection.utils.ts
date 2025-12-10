/**
 * Device Detection Utilities
 * Pure functions for detecting device capabilities
 * Enterprise-grade with security considerations
 */

// Types
export interface DeviceCapabilities {
  readonly isMobile: boolean;
  readonly isAndroid: boolean;
  readonly isIOS: boolean;
  readonly hasCamera: boolean;
  readonly hasMediaDevices: boolean;
  readonly supportsFileAPI: boolean;
  readonly supportsGetUserMedia: boolean;
}

/**
 * Pure function to detect if device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword));
};

/**
 * Pure function to detect Android
 */
export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /android/i.test(window.navigator.userAgent);
};

/**
 * Pure function to detect iOS
 */
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
};

/**
 * Pure function to check if device has camera access
 */
export const hasCamera = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
};

/**
 * Pure function to check if device supports File API
 */
export const supportsFileAPI = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'File' in window && 'FileReader' in window && 'FileList' in window && 'Blob' in window;
};

/**
 * Pure function to get all device capabilities
 */
export const getDeviceCapabilities = (): DeviceCapabilities => ({
  isMobile: isMobileDevice(),
  isAndroid: isAndroidDevice(),
  isIOS: isIOSDevice(),
  hasCamera: hasCamera(),
  hasMediaDevices: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
  supportsFileAPI: supportsFileAPI(),
  supportsGetUserMedia: hasCamera(),
});

/**
 * Pure function to get optimal camera constraints for device
 */
export const getCameraConstraints = (facingMode: 'user' | 'environment' = 'environment'): MediaStreamConstraints => {
  const isMobile = isMobileDevice();
  
  return {
    video: {
      facingMode,
      width: { ideal: isMobile ? 1280 : 1920 },
      height: { ideal: isMobile ? 720 : 1080 },
    },
    audio: false,
  };
};

/**
 * Pure function to check if browser supports native camera input
 */
export const supportsNativeCameraInput = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  const input = document.createElement('input');
  input.setAttribute('capture', 'camera');
  input.setAttribute('accept', 'image/*');
  
  return input.capture !== undefined;
};

/**
 * Pure function to get recommended file accept attribute
 */
export const getFileAcceptAttribute = (type: 'image' | 'video' | 'both' = 'both'): string => {
  const accepts = {
    image: 'image/*',
    video: 'video/*',
    both: 'image/*,video/*',
  };
  
  return accepts[type];
};

/**
 * Pure function to get capture attribute for native camera
 */
export const getCaptureAttribute = (
  type: 'image' | 'video' | 'both',
  facingMode: 'user' | 'environment' = 'environment'
): boolean | 'user' | 'environment' | undefined => {
  const isMobile = isMobileDevice();
  
  if (!isMobile) return undefined;
  
  // For mobile devices, use capture attribute
  // HTML5 capture only supports: boolean, "user", "environment"
  if (type === 'video') return true; // Use default camera for video
  if (type === 'image') return facingMode; // Use specified facing mode
  
  return true; // Default to true for 'both'
};

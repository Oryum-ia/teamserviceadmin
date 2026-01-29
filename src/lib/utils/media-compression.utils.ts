/**
 * Video Compression Utilities
 * Enterprise-grade video compression using browser APIs
 * Follows functional programming principles
 */

// Types
export interface CompressionOptions {
  readonly maxSizeMB: number;
  readonly maxWidthOrHeight: number;
  readonly quality: number;
  readonly useWebWorker?: boolean;
}

export interface CompressionResult {
  readonly file: File;
  readonly originalSize: number;
  readonly compressedSize: number;
  readonly compressionRatio: number;
}

// Constants
const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxSizeMB: 166.67,
  maxWidthOrHeight: 1920,
  quality: 0.8,
  useWebWorker: true,
} as const;

/**
 * Pure function to calculate compression ratio
 */
export const calculateCompressionRatio = (originalSize: number, compressedSize: number): number =>
  originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;

/**
 * Pure function to format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Compress video - Currently returns original file
 * Note: Full video compression requires FFmpeg.wasm or server-side processing
 * For now, we validate the file and return it as-is to avoid data loss
 */
export const compressVideo = async (
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
  
  // Validate input
  if (!file.type.startsWith('video/')) {
    throw new Error('File must be a video');
  }

  const originalSize = file.size;

  // For videos, we simply validate and return the original
  // True video compression requires FFmpeg.wasm or server-side processing
  // Converting to image would lose all video data!
  
  // Validate video file size
  const maxVideoSizeMB = opts.maxSizeMB * 3; // Allow videos to be 3x the image limit
  const maxBytes = maxVideoSizeMB * 1024 * 1024;
  
  if (originalSize > maxBytes) {
    throw new Error(`Video file is too large. Maximum size is ${formatFileSize(maxBytes)}. Please record a shorter video or use a lower resolution.`);
  }

  // Validate that the video can be loaded (basic integrity check)
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Video loading timeout'));
      }, 10000); // 10 second timeout

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load video. The file may be corrupted or in an unsupported format.'));
      };
    });

    // Clean up
    URL.revokeObjectURL(videoUrl);
    
    // Return original file - no compression applied
    console.log('📹 Video validated successfully:', {
      name: file.name,
      size: formatFileSize(originalSize),
      duration: `${video.duration?.toFixed(1) || 'unknown'}s`,
      dimensions: `${video.videoWidth}x${video.videoHeight}`,
    });

    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0, // No compression performed
    };
  } catch (error) {
    console.error('Video validation failed:', error);
    throw error instanceof Error ? error : new Error('Failed to process video file');
  }
};

/**
 * Pure function to calculate new dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const aspectRatio = width / height;

  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  }

  return {
    width: Math.round(maxDimension * aspectRatio),
    height: maxDimension,
  };
};

/**
 * Compress image using Canvas API
 */
export const compressImage = async (
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
  
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const originalSize = file.size;

  // If file is already small enough, return as is
  if (originalSize <= opts.maxSizeMB * 1024 * 1024) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }

  try {
    const img = await createImageBitmap(file);
    const { width, height } = calculateDimensions(img.width, img.height, opts.maxWidthOrHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
        'image/jpeg',
        opts.quality
      );
    });

    const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
    const compressedSize = compressedFile.size;

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio: calculateCompressionRatio(originalSize, compressedSize),
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }
};

/**
 * Compress media file (image or video)
 */
export const compressMedia = async (
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> => {
  if (file.type.startsWith('video/')) {
    return compressVideo(file, options);
  }
  
  if (file.type.startsWith('image/')) {
    return compressImage(file, options);
  }

  throw new Error('Unsupported file type');
};

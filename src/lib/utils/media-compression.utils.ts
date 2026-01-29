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
 * Compress video using Canvas API to extract frames and create a compressed video
 * This is a client-side solution that works without FFmpeg
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
  const maxBytes = 50 * 1024 * 1024; // 50MB hard limit for Supabase

  // If video is already under the limit, return as-is
  if (originalSize <= maxBytes) {
    console.log('📹 Video is under 50MB, no compression needed');
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }

  // Validate that the video can be loaded
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Video loading timeout'));
      }, 10000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load video. The file may be corrupted or in an unsupported format.'));
      };
    });

    console.log('📹 Video info:', {
      name: file.name,
      size: formatFileSize(originalSize),
      duration: `${video.duration?.toFixed(1) || 'unknown'}s`,
      dimensions: `${video.videoWidth}x${video.videoHeight}`,
    });

    // Calculate target dimensions
    const { width, height } = calculateDimensions(
      video.videoWidth,
      video.videoHeight,
      opts.maxWidthOrHeight
    );

    // Create canvas for re-encoding
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Check if MediaRecorder API is available
    if (!window.MediaRecorder || !canvas.captureStream) {
      console.warn('⚠️ MediaRecorder API not available, returning original file');
      throw new Error(`Video es demasiado grande (${formatFileSize(originalSize)}). El límite es 50MB. Por favor graba un video más corto o usa menor resolución.`);
    }

    // Create a stream from canvas
    const stream = canvas.captureStream(30); // 30 FPS
    
    // Determine the best codec and bitrate
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    if (!selectedMimeType) {
      throw new Error(`Video es demasiado grande (${formatFileSize(originalSize)}). El límite es 50MB. Por favor graba un video más corto.`);
    }

    // Calculate target bitrate to stay under 50MB
    const targetSizeMB = 45; // Target 45MB to have some margin
    const targetBitrate = Math.floor((targetSizeMB * 1024 * 1024 * 8) / video.duration);
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: Math.min(targetBitrate, 2500000), // Max 2.5 Mbps
    });

    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms

    // Play video and draw frames to canvas
    video.currentTime = 0;
    await video.play();

    const drawFrame = () => {
      if (video.paused || video.ended) {
        return;
      }
      ctx.drawImage(video, 0, 0, width, height);
      requestAnimationFrame(drawFrame);
    };

    drawFrame();

    // Wait for video to finish
    await new Promise<void>((resolve) => {
      video.onended = () => {
        mediaRecorder.stop();
        resolve();
      };
    });

    // Wait for recorder to finish
    const compressedBlob = await new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedMimeType });
        resolve(blob);
      };
    });

    // Clean up
    URL.revokeObjectURL(videoUrl);
    stream.getTracks().forEach(track => track.stop());

    const compressedSize = compressedBlob.size;

    // Check if compression was successful
    if (compressedSize > maxBytes) {
      throw new Error(`No se pudo comprimir el video lo suficiente. Tamaño final: ${formatFileSize(compressedSize)}. Por favor graba un video más corto.`);
    }

    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^/.]+$/, '.webm'),
      { type: selectedMimeType }
    );

    console.log('✅ Video compressed successfully:', {
      original: formatFileSize(originalSize),
      compressed: formatFileSize(compressedSize),
      ratio: `${calculateCompressionRatio(originalSize, compressedSize).toFixed(1)}%`,
    });

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio: calculateCompressionRatio(originalSize, compressedSize),
    };
  } catch (error) {
    console.error('Video compression failed:', error);
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

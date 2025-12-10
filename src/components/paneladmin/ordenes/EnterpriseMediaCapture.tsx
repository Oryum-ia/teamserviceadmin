"use client";

/**
 * Enterprise Media Capture Component
 * Follows SOLID principles and functional programming
 * Supports native camera API for Android/iOS with automatic video compression
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Camera, Video, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import {
  getDeviceCapabilities,
  getCameraConstraints,
  getCaptureAttribute,
  getFileAcceptAttribute,
  type DeviceCapabilities,
} from '@/lib/utils/device-detection.utils';
import {
  compressMedia,
  formatFileSize,
  type CompressionResult,
} from '@/lib/utils/media-compression.utils';

// Types (Interface Segregation Principle)
export interface MediaCaptureProps {
  readonly onCapture: (file: File, compressionInfo?: CompressionResult) => void | Promise<void>;
  readonly onError?: (error: Error) => void;
  readonly mode?: 'image' | 'video' | 'both';
  readonly facingMode?: 'user' | 'environment';
  readonly disabled?: boolean;
  readonly maxSizeMB?: number;
  readonly autoCompress?: boolean;
  readonly showCompressionInfo?: boolean;
}

interface CaptureState {
  readonly isCapturing: boolean;
  readonly isCompressing: boolean;
  readonly error: string | null;
  readonly compressionInfo: CompressionResult | null;
}

// Initial state (Immutability)
const INITIAL_STATE: CaptureState = {
  isCapturing: false,
  isCompressing: false,
  error: null,
  compressionInfo: null,
} as const;

/**
 * Enterprise Media Capture Component
 * Single Responsibility: Handle media capture with native APIs
 */
export default function EnterpriseMediaCapture({
  onCapture,
  onError,
  mode = 'both',
  facingMode = 'environment',
  disabled = false,
  maxSizeMB = 10,
  autoCompress = true,
  showCompressionInfo = true,
}: MediaCaptureProps) {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State management (immutable updates)
  const [state, setState] = useState<CaptureState>(INITIAL_STATE);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);

  // Effect: Detect device capabilities on mount
  useEffect(() => {
    const caps = getDeviceCapabilities();
    setCapabilities(caps);
    
    // Security: Log capabilities for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('📱 Device Capabilities:', caps);
    }
  }, []);

  /**
   * Pure function: Update state immutably
   */
  const updateState = useCallback((updates: Partial<CaptureState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Pure function: Handle errors
   */
  const handleError = useCallback((error: Error) => {
    console.error('❌ Media capture error:', error);
    updateState({ error: error.message, isCapturing: false, isCompressing: false });
    onError?.(error);
  }, [onError, updateState]);

  /**
   * Pure function: Process captured file
   */
  const processFile = useCallback(async (file: File) => {
    try {
      updateState({ isCapturing: true, error: null });

      // Validate file
      if (!file) {
        throw new Error('No file selected');
      }

      // Security: Validate file type
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      if (!isValidType) {
        throw new Error('Invalid file type. Only images and videos are allowed.');
      }

      // Security: Validate file size (before compression)
      const maxBytes = maxSizeMB * 1024 * 1024 * 5; // 5x the target for pre-compression
      if (file.size > maxBytes) {
        throw new Error(`File too large. Maximum size is ${formatFileSize(maxBytes)}`);
      }

      let finalFile = file;
      let compressionInfo: CompressionResult | null = null;

      // Compress if enabled
      if (autoCompress) {
        updateState({ isCompressing: true });
        
        compressionInfo = await compressMedia(file, {
          maxSizeMB,
          maxWidthOrHeight: capabilities?.isMobile ? 1280 : 1920,
          quality: 0.8,
        });

        finalFile = compressionInfo.file;
        updateState({ compressionInfo, isCompressing: false });

        // Log compression results (development only)
        if (process.env.NODE_ENV === 'development') {
          console.log('📦 Compression Results:', {
            original: formatFileSize(compressionInfo.originalSize),
            compressed: formatFileSize(compressionInfo.compressedSize),
            ratio: `${compressionInfo.compressionRatio.toFixed(1)}%`,
          });
        }
      }

      // Call parent callback
      await onCapture(finalFile, compressionInfo || undefined);
      
      updateState({ isCapturing: false, error: null });
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [autoCompress, capabilities, handleError, maxSizeMB, onCapture, updateState]);

  /**
   * Handler: File input change
   */
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    
    // Reset input to allow same file selection
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [processFile]);

  /**
   * Handler: Open native camera
   */
  const openCamera = useCallback((type: 'image' | 'video') => {
    if (disabled || state.isCapturing) return;
    
    // Security: Check permissions
    if (!capabilities?.hasCamera && !capabilities?.supportsFileAPI) {
      handleError(new Error('Camera not available on this device'));
      return;
    }

    // Trigger file input with appropriate attributes
    if (inputRef.current) {
      inputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      inputRef.current.click();
    }
  }, [capabilities, disabled, handleError, state.isCapturing]);

  // Render: Loading state
  if (!capabilities) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
      </div>
    );
  }

  // Render: Error state
  if (!capabilities.supportsFileAPI) {
    return (
      <div className={`p-4 rounded-lg border ${
        theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800'
      }`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className={`text-sm ${
            theme === 'light' ? 'text-red-800' : 'text-red-300'
          }`}>
            Your browser doesn't support file uploads
          </p>
        </div>
      </div>
    );
  }

  const isProcessing = state.isCapturing || state.isCompressing;

  return (
    <div className="space-y-4">
      {/* Hidden file input with native camera support */}
      <input
        ref={inputRef}
        type="file"
        accept={getFileAcceptAttribute(mode)}
        capture={getCaptureAttribute(mode, facingMode)}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* Capture buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {(mode === 'image' || mode === 'both') && (
          <button
            type="button"
            onClick={() => openCamera('image')}
            disabled={disabled || isProcessing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              theme === 'light'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
          >
            <Camera className="w-5 h-5" />
            <span>Tomar Foto</span>
          </button>
        )}

        {(mode === 'video' || mode === 'both') && (
          <button
            type="button"
            onClick={() => openCamera('video')}
            disabled={disabled || isProcessing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              theme === 'light'
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
          >
            <Video className="w-5 h-5" />
            <span>Grabar Video</span>
          </button>
        )}
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'
        }`}>
          <div className="flex items-center gap-3">
            {state.isCompressing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className={`text-sm font-medium ${
                    theme === 'light' ? 'text-blue-800' : 'text-blue-300'
                  }`}>
                    Comprimiendo archivo...
                  </p>
                  <p className={`text-xs ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                  }`}>
                    Esto puede tomar unos segundos
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 animate-bounce text-blue-600" />
                <p className={`text-sm font-medium ${
                  theme === 'light' ? 'text-blue-800' : 'text-blue-300'
                }`}>
                  Procesando archivo...
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Compression info */}
      {showCompressionInfo && state.compressionInfo && state.compressionInfo.compressionRatio > 0 && (
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-800'
        }`}>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${
                theme === 'light' ? 'text-green-800' : 'text-green-300'
              }`}>
                Archivo comprimido exitosamente
              </p>
              <div className={`text-xs space-y-1 ${
                theme === 'light' ? 'text-green-700' : 'text-green-400'
              }`}>
                <p>Original: {formatFileSize(state.compressionInfo.originalSize)}</p>
                <p>Comprimido: {formatFileSize(state.compressionInfo.compressedSize)}</p>
                <p>Reducción: {state.compressionInfo.compressionRatio.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {state.error && (
        <div className={`p-4 rounded-lg border ${
          theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className={`text-sm ${
              theme === 'light' ? 'text-red-800' : 'text-red-300'
            }`}>
              {state.error}
            </p>
          </div>
        </div>
      )}

      {/* Device info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className={`text-xs ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
        }`}>
          <summary className="cursor-pointer">Device Info</summary>
          <pre className="mt-2 p-2 rounded bg-gray-100 dark:bg-gray-800 overflow-auto">
            {JSON.stringify(capabilities, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, X, Check, RotateCcw, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
  mode?: 'photo' | 'video' | 'both';
}

export default function CameraCapture({ onCapture, disabled = false, mode = 'both' }: CameraCaptureProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Iniciar cámara
  const startCamera = async () => {
    try {
      setError(null);
      
      // Configuración optimizada para video fluido (720p @ 30fps)
      const videoConstraints: MediaTrackConstraints = {
        facingMode: 'environment', // Cámara trasera en móviles
        width: { ideal: 1280, max: 1280 },
        height: { ideal: 720, max: 720 },
        frameRate: { ideal: 30, min: 24 } // Mínimo 24fps, ideal 30fps
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: captureMode === 'video'
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Tomar foto
  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedMedia(dataUrl);
      stopCamera();
    }
  };

  // Iniciar grabación de video
  const startRecording = () => {
    if (!stream) return;

    try {
      chunksRef.current = [];
      
      // Detectar el mejor codec soportado
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus'; // VP9 es más eficiente
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus')) {
        mimeType = 'video/webm;codecs=h264,opus'; // H264 para mejor compatibilidad
      } else if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm'; // Fallback básico
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps para buena calidad a 720p
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setCapturedMedia(url);
        stopCamera();
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      // Timer para mostrar duración
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      setError('No se pudo iniciar la grabación.');
    }
  };

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Confirmar y enviar
  const confirmCapture = async () => {
    if (!capturedMedia) return;

    try {
      const response = await fetch(capturedMedia);
      const blob = await response.blob();
      
      const fileName = captureMode === 'photo' 
        ? `foto-${Date.now()}.jpg`
        : `video-${Date.now()}.webm`;
      
      const file = new File([blob], fileName, { 
        type: captureMode === 'photo' ? 'image/jpeg' : 'video/webm' 
      });
      
      onCapture(file);
      handleClose();
    } catch (err) {
      console.error('Error al procesar captura:', err);
      setError('Error al procesar la captura.');
    }
  };

  // Reintentar
  const retake = () => {
    setCapturedMedia(null);
    setRecordingTime(0);
    startCamera();
  };

  // Cerrar modal
  const handleClose = () => {
    stopCamera();
    setCapturedMedia(null);
    setIsRecording(false);
    setRecordingTime(0);
    setError(null);
    setIsOpen(false);
  };

  // Abrir modal
  const handleOpen = (mode: 'photo' | 'video') => {
    setCaptureMode(mode);
    setIsOpen(true);
  };

  // Efecto para iniciar cámara al abrir
  useEffect(() => {
    if (isOpen && !capturedMedia) {
      startCamera();
    }
    
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, capturedMedia]);

  // Formatear tiempo de grabación
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Botones de activación */}
      <div className="flex gap-2">
        {(mode === 'photo' || mode === 'both') && (
          <button
            onClick={() => handleOpen('photo')}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              disabled
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60'
                : theme === 'light'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-400 hover:bg-blue-500 text-black'
            }`}
            title="Tomar foto con cámara"
          >
            <Camera className="w-4 h-4" />
            <span>Cámara</span>
          </button>
        )}
        
        {(mode === 'video' || mode === 'both') && (
          <button
            onClick={() => handleOpen('video')}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              disabled
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60'
                : theme === 'light'
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-purple-400 hover:bg-purple-500 text-black'
            }`}
            title="Grabar video con cámara"
          >
            <Video className="w-4 h-4" />
            <span>Video</span>
          </button>
        )}
      </div>

      {/* Modal de cámara */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-4xl rounded-lg overflow-hidden ${
            theme === 'light' ? 'bg-white' : 'bg-gray-800'
          }`}>
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between border-b ${
              theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-700 border-gray-600'
            }`}>
              <h3 className={`text-lg font-semibold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {captureMode === 'photo' ? '📷 Tomar Foto' : '🎥 Grabar Video'}
              </h3>
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'light' 
                    ? 'hover:bg-gray-200 text-gray-600' 
                    : 'hover:bg-gray-600 text-gray-300'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4">
              {error ? (
                <div className={`p-6 rounded-lg text-center ${
                  theme === 'light' ? 'bg-red-50 text-red-800' : 'bg-red-900/20 text-red-300'
                }`}>
                  <p className="font-medium mb-2">⚠️ Error</p>
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={retake}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reintentar
                  </button>
                </div>
              ) : capturedMedia ? (
                // Preview de captura
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    {captureMode === 'photo' ? (
                      <img src={capturedMedia} alt="Captura" className="w-full h-auto" />
                    ) : (
                      <video src={capturedMedia} controls className="w-full h-auto" />
                    )}
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={retake}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                        theme === 'light'
                          ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                          : 'bg-gray-600 hover:bg-gray-500 text-white'
                      }`}
                    >
                      <RotateCcw className="w-5 h-5" />
                      Repetir
                    </button>
                    
                    <button
                      onClick={confirmCapture}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                        theme === 'light'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                      Usar esta {captureMode === 'photo' ? 'foto' : 'grabación'}
                    </button>
                  </div>
                </div>
              ) : (
                // Vista de cámara en vivo
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Indicador de grabación */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg font-medium">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                        REC {formatTime(recordingTime)}
                      </div>
                    )}
                  </div>
                  
                  {/* Controles */}
                  <div className="flex justify-center">
                    {captureMode === 'photo' ? (
                      <button
                        onClick={takePhoto}
                        disabled={!stream}
                        className={`p-6 rounded-full transition-all ${
                          stream
                            ? 'bg-white hover:bg-gray-100 shadow-lg hover:scale-110'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Camera className="w-8 h-8 text-gray-800" />
                      </button>
                    ) : (
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={!stream}
                        className={`p-6 rounded-full transition-all ${
                          stream
                            ? isRecording
                              ? 'bg-red-600 hover:bg-red-700 shadow-lg'
                              : 'bg-white hover:bg-gray-100 shadow-lg hover:scale-110'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isRecording ? (
                          <div className="w-8 h-8 bg-white rounded-sm" />
                        ) : (
                          <Video className="w-8 h-8 text-gray-800" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  <p className={`text-center text-sm ${
                    theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {captureMode === 'photo' 
                      ? 'Presiona el botón para tomar la foto'
                      : isRecording
                        ? 'Presiona el botón para detener la grabación'
                        : 'Presiona el botón para iniciar la grabación'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

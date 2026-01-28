import React from 'react';
import { X, Play } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { getThumbnailUrl } from '@/lib/utils/imageOptimization';

interface ImagenesGridProps {
  imagenes: string[];
  onRemove?: (url: string, index: number) => void;
}

export default function ImagenesGrid({ imagenes, onRemove }: ImagenesGridProps) {
  const { theme } = useTheme();
  
  const isVideo = (url: string) => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || 
           url.includes('video') || url.match(/\.(mp4|webm|mov|avi|mkv)$/i);
  };
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {imagenes.map((url, idx) => (
        <div key={idx} className="relative group">
          {onRemove && (
            <button
              onClick={() => onRemove(url, idx)}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {isVideo(url) ? (
            <>
              <video
                src={url}
                className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/70 rounded-full p-3">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            </>
          ) : (
            <img
              src={getThumbnailUrl(url)}
              alt={`foto-${idx}`}
              className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              loading="lazy"
            />
          )}
        </div>
      ))}
    </div>
  );
}

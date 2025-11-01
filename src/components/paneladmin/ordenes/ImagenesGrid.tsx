import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface ImagenesGridProps {
  imagenes: string[];
  onRemove?: (url: string, index: number) => void;
}

export default function ImagenesGrid({ imagenes, onRemove }: ImagenesGridProps) {
  const { theme } = useTheme();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {imagenes.map((url, idx) => (
        <div key={idx} className="relative group">
          {onRemove && (
            <button
              onClick={() => onRemove(url, idx)}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <img src={url} alt={`foto-${idx}`} className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
        </div>
      ))}
    </div>
  );
}

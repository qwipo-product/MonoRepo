import { useRef, useState } from 'react';
import { CheckCircle2, ImageUp, XCircle } from 'lucide-react';

import type { PromotionAsset } from '../../types/campaign';

interface ImageDropzoneProps {
  requiredWidth: number;
  requiredHeight: number;
  asset: PromotionAsset;
  onChange: (asset: PromotionAsset) => void;
}

export function ImageDropzone({ requiredWidth, requiredHeight, asset, onChange }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const isValid = asset.width === requiredWidth && asset.height === requiredHeight;

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
      if (!dataUrl) return;
      const image = new Image();
      image.onload = () => {
        onChange({ file_name: file.name, data_url: dataUrl, width: image.naturalWidth, height: image.naturalHeight });
      };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) processFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
          dragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-600 hover:bg-blue-50'
        }`}
      >
        <ImageUp className="size-6 text-gray-500" aria-hidden="true" />
        <p className="text-sm font-medium text-gray-900">Drop a banner image, or click to browse</p>
        <p className="text-xs text-gray-500">
          Required: {requiredWidth} × {requiredHeight}px
        </p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleFiles(event.target.files)} />
      </div>

      {asset.file_name && (
        <div
          className={`mt-3 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            isValid ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{asset.file_name}</p>
            <p className="text-xs text-gray-500">
              {asset.width} × {asset.height}px
            </p>
          </div>
          {isValid ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Passed
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
              <XCircle className="size-3.5" aria-hidden="true" />
              Failed
            </span>
          )}
        </div>
      )}
    </div>
  );
}

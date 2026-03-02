'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
    type: 'avatar' | 'banner' | 'poster';
    movieId?: string;
    currentImageUrl?: string | null;
    onFileSelect: (file: File, previewUrl: string) => void;
    label: string;
    aspectRatio?: 'auto' | 'square' | 'video' | 'poster';
}

export default function ImageUploader({ type, movieId, currentImageUrl, onFileSelect, label, aspectRatio = 'auto' }: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (JPG, PNG, WebP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setError(null);
        setIsUploading(false); // We no longer upload immediately

        // Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);

        // Notify parent of the selected file to be uploaded later
        onFileSelect(file, localPreview);

        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    };

    const aspectClass = {
        'auto': 'aspect-auto',
        'square': 'aspect-square',
        'video': 'aspect-video',
        'poster': 'aspect-[2/3]'
    }[aspectRatio];

    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--accent)]">{label}</span>
            <div
                className={`relative flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden transition-colors hover:border-[var(--accent)] cursor-pointer ${aspectClass} ${aspectRatio === 'auto' ? 'min-h-[150px]' : ''}`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                {previewUrl ? (
                    <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center p-6 text-center opacity-70">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-sm">Click to upload {label.toLowerCase()}</span>
                        <span className="text-xs text-[var(--text-muted)] mt-1">JPG, PNG, WebP (max 5MB)</span>
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
                        <span className="text-sm font-medium">Uploading...</span>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                />
            </div>
            {error && <span className="text-sm text-red-500 mt-1">{error}</span>}
        </div>
    );
}

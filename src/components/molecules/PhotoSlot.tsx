
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PhotoSlotProps {
    className?: string;
    imageUrl: string | null;
    onFileSelect: (file: File) => void;
    onDelete: () => void;
    label: string;
    isUploading: boolean;
}

export const PhotoSlot = ({ className, imageUrl, onFileSelect, onDelete, label, isUploading }: PhotoSlotProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onFileSelect(file);
        if (event.target) event.target.value = '';
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                onFileSelect(file);
            } else {
                toast.error('Archivo no válido', { description: 'Por favor, arrastra un archivo de imagen.' });
            }
        }
    };

    return (
        <div
            className={cn(
                "relative group bg-quaternary border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center overflow-hidden transition-all",
                isDragging && "border-primary ring-2 ring-primary ring-offset-2",
                className
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {imageUrl ? (
                <>
                    <img
                        src={imageUrl}
                        alt={label}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="destructive" size="icon" onClick={onDelete} disabled={isUploading}>
                            <Trash2 />
                            <span className="sr-only">Borrar {label}</span>
                        </Button>
                    </div>
                </>
            ) : (
                <div className="text-center p-4">
                    <input type="file" ref={inputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/webp" className="hidden" />
                    <Button variant="ghost" className="h-auto p-4 flex flex-col items-center justify-center" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                        {isUploading
                            ? <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                            : <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                        }
                        <span className="text-label font-normal text-muted-foreground">
                            {isUploading ? 'Subiendo...' : (isDragging ? 'Suelta la imagen aquí' : label)}
                        </span>
                    </Button>
                </div>
            )}
        </div>
    );
};

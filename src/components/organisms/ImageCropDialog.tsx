
'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import imageCompression from 'browser-image-compression';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Crop, Loader2 } from 'lucide-react'
import { MAX_UPLOAD_BYTES } from '@/lib/constants'

interface ImageCropDialogProps {
  imageSrc: string | null
  aspect: number
  onCropComplete: (croppedImage: File) => void
  onClose: () => void
}

/**
 * Crea una imagen recortada a partir de un canvas.
 * @param image - El elemento de imagen original.
 * @param croppedAreaPixels - El área de recorte en píxeles.
 * @returns Una promesa que resuelve a un objeto File o null.
 */
async function getCroppedImg(
  image: HTMLImageElement,
  croppedAreaPixels: Area,
  fileName: string
): Promise<File | null> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // Define el tamaño del canvas al del recorte
  canvas.width = croppedAreaPixels.width
  canvas.height = croppedAreaPixels.height

  // Dibuja la imagen recortada en el canvas
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  )

  // Obtiene el blob del canvas
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(null)
        return
      }
      // Comprime la imagen antes de devolverla
      const options = {
        maxSizeMB: (MAX_UPLOAD_BYTES / 1024 / 1024) - 0.5, // Deja un margen
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }
      try {
        const compressedFile = await imageCompression(new File([blob], fileName, { type: 'image/webp' }), options);
        resolve(compressedFile);
      } catch (error) {
        console.error('Error en la compresión:', error);
        // Si la compresión falla, devuelve el original
        resolve(new File([blob], fileName, { type: 'image/webp' }));
      }
    }, 'image/webp', 0.9)
  })
}

export function ImageCropDialog({
  imageSrc,
  aspect,
  onCropComplete,
  onClose,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixelsValue: Area) => {
      setCroppedAreaPixels(croppedAreaPixelsValue)
    },
    []
  )

  const handleConfirmCrop = useCallback(async () => {
    if (!croppedAreaPixels || !imageSrc) return
    setIsLoading(true)

    const image = new Image()
    image.src = imageSrc
    image.onload = async () => {
      const croppedImageFile = await getCroppedImg(
        image,
        croppedAreaPixels,
        'cropped_image.webp'
      )
      if (croppedImageFile) {
        onCropComplete(croppedImageFile)
      }
      onClose()
    }
    image.onerror = () => {
      setIsLoading(false)
      onClose();
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete, onClose])

  return (
    <Dialog open={!!imageSrc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recortar Imagen</DialogTitle>
        </DialogHeader>

        <div className="relative h-96 w-full bg-muted">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              objectFit="contain"
              showGrid={true}
            />
          )}
        </div>

        <div className="space-y-4">
          <Label htmlFor="zoom">Zoom</Label>
          <Slider
            id="zoom"
            min={1}
            max={3}
            step={0.1}
            value={[zoom]}
            onValueChange={(value) => setZoom(value[0])}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirmCrop} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Crop className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Procesando...' : 'Confirmar Recorte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

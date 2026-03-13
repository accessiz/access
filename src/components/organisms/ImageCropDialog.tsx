
'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'

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

interface ImageCropDialogProps {
  imageSrc: string | null
  aspect: number
  onCropComplete: (croppedImage: File) => void
  onClose: () => void
}

/**
 * Crops the visible area from the source image into a WebP file.
 *
 * Design decision: output at NATIVE crop resolution — no downscale here.
 * Compression happens in the caller via compressForPrint / compressForDisplay
 * to avoid double-lossy encoding (canvas→WebP→browser-image-compression→WebP).
 *
 * WebP at quality 0.92 keeps crop near-lossless while smaller than PNG.
 */
async function getCroppedImg(
  image: HTMLImageElement,
  croppedAreaPixels: Area,
  fileName: string
): Promise<File | null> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  canvas.width = croppedAreaPixels.width
  canvas.height = croppedAreaPixels.height

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

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { resolve(null); return }
        resolve(new File([blob], fileName, { type: 'image/webp' }))
      },
      'image/webp',
      0.92
    )
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

    try {
      const image = new Image()

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Failed to load image for crop'))
        image.src = imageSrc
      })

      const croppedFile = await getCroppedImg(
        image,
        croppedAreaPixels,
        'cropped_image.webp'
      )

      if (croppedFile) {
        onCropComplete(croppedFile)
      }
    } catch {
      // Silently handle — dialog will close
    } finally {
      setIsLoading(false)
      onClose()
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

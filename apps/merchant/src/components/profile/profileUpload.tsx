'use client'

import { useState, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { ProfileMerchantImage } from '@/types/props/userProp'

interface ProfileLogoUploadProps {
  images: ProfileMerchantImage[] | ProfileMerchantImage | null | undefined
  onImagesChange: (images: ProfileMerchantImage[]) => void
  maxImages?: number
}

export function ProfileLogoUpload({
  images,
  onImagesChange,
  maxImages = 1
}: ProfileLogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Normalize to array
  const imgList = useMemo<ProfileMerchantImage[]>(() => {
    if (!images) return []
    return Array.isArray(images) ? images : [images]
  }, [images])

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const file = files[0]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} file size exceeds 5MB`)
        return
      }

      // Clean up existing blob URLs to prevent memory leaks
      imgList.forEach((image) => {
        if (image.url?.startsWith?.('blob:')) {
          URL.revokeObjectURL(image.url)
        }
      })

      // Create blob URL for preview
      const previewUrl = URL.createObjectURL(file)

      const imageData: ProfileMerchantImage = {
        url: previewUrl,
        fileName: file.name
      }

      // โปรไฟล์มีรูปเดียว → แทนที่ทันที
      onImagesChange([imageData])
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = () => {
    // Clean up blob URL ถ้ามี
    if (imgList.length > 0 && imgList[0].url?.startsWith?.('blob:')) {
      URL.revokeObjectURL(imgList[0].url)
    }

    // ลบออกจาก preview เท่านั้น (จะลบจริงเมื่อกด Save)
    onImagesChange([])
  }

  const hasImage = imgList.length > 0

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center justify-start">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {hasImage ? 'Change Logo' : uploading ? 'Uploading...' : 'Add Logo'}
        </Button>
      </div>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Display */}
      {!hasImage ? (
        <Card
          className="p-8 text-center border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No logo uploaded</p>
          <p className="text-xs text-muted-foreground">
            Click to upload an image
          </p>
        </Card>
      ) : (
        <Card className="relative group overflow-hidden">
          <div className="aspect-square relative max-w-xs mx-auto">
            <img
              src={imgList[0].url}
              alt={imgList[0].fileName || 'Profile logo'}
              className="w-full h-full object-cover"
            />

            {/* Hover Overlay (Desktop) */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={removeImage}
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>

            {/* Remove Button (Mobile - Always Visible) */}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={removeImage}
              className="absolute top-2 right-2 h-8 w-8 p-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* File Info */}
          <div className="p-2">
            <p className="text-xs text-muted-foreground truncate">
              {imgList[0].fileName}
            </p>
            <p className="text-xs text-green-600">
              {imgList[0].url?.startsWith?.('blob:')
                ? 'New image - will upload on save'
                : 'Current logo'}
            </p>
          </div>
        </Card>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        JPG, PNG, GIF (max 5MB) • Changes will be saved when you click
        &quot;Save Changes&quot;
      </p>
    </div>
  )
}

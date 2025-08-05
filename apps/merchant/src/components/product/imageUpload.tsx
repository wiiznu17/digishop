"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Upload, Image as ImageIcon, Star } from "lucide-react"
import { ProductImage } from "@/types/props/productProp"
import {
  deleteProductImageRequester,
  updateProductImageRequester
} from "@/utils/requestUtils/requestProductUtils"

interface ImageUploadProps {
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
  maxImages?: number
  productId?: string // เพื่อใช้ในการลบรูปจาก server
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  productId // เพิ่ม productId ใน destructuring
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files) return

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      alert(`You can maximum upload ${maxImages} pictures`)
      return
    }

    setUploading(true)

    try {
      const newImages: ProductImage[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert(`${file.name} Not image file`)
          continue
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} File size is more than 5MB`)
          continue
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file)

        const imageData: ProductImage = {
          url: previewUrl,
          fileName: file.name,
          isMain: images.length === 0 && newImages.length === 0 // First image is main
        }

        newImages.push(imageData)
      }

      onImagesChange([...images, ...newImages])
    } catch (error) {
      console.error("Error processing files:", error)
      alert("Error to processing files")
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = async (index: number) => {
    const imageToRemove = images[index]

    // ถ้าเป็นรูปที่อยู่ใน server แล้ว (มี id และไม่ใช่ blob URL)
    if (
      productId &&
      imageToRemove.id &&
      !imageToRemove.url.startsWith("blob:")
    ) {
      try {
        console.log("Removing image")
        await deleteProductImageRequester(productId, imageToRemove.id)
      } catch (error) {
        console.error("Error deleting image from server:", error)
        alert("Error deleting image")
        return
      }
    }

    const updatedImages = images.filter((_, i) => i !== index)

    // If we removed the main image, set the first remaining image as main
    if (images[index].isMain && updatedImages.length > 0) {
      updatedImages[0].isMain = true
    }

    onImagesChange(updatedImages)
  }

  const setMainImage = async (index: number) => {
    // const selectedImage = images[index]
    // console.log("selected image in setMAin image", selectedImage)
    const updatedImages = images.map((img, i) => ({
      ...img,
      isMain: i === index
    }))
    if (!updatedImages.some((img) => img.isMain) && updatedImages.length > 0) {
      updatedImages[0].isMain = true
    }
    onImagesChange(updatedImages)
    console.log("Is main updated", updatedImages)
    const selectedImage = images[index]
    console.log("Selected image = ", selectedImage)
    if (
      productId &&
      selectedImage.id &&
      !selectedImage.url.startsWith("blob:")
    ) {
      try {
        await updateProductImageRequester(productId, selectedImage.id, {
          isMain: true,
          order: 0
        })
      } catch (error) {
        console.error("Error setting main image on server:", error)
        alert("Error setting main image")
        return
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          Product image ({images.length}/{maxImages})
        </Label>
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Add image"}
          </Button>
        )}
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No image upload</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Pick image
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-full object-cover"
                />

                {/* Main image indicator */}
                {image.isMain && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Main
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!image.isMain && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setMainImage(index)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate">
                  {image.fileName}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Include file: JPG, PNG, GIF (max 5MB per picture)
      </p>
    </div>
  )
}

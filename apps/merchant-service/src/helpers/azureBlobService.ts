import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

class StorageService {
  private supabase: SupabaseClient
  private bucketName: string
  
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // แนะนำให้ใช้ Service Role Key สำหรับ Backend
    this.bucketName = process.env.SUPABASE_BUCKET_NAME || 'digishop-images'
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Key is not configured')
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }
  
  async uploadImage(
    file: Express.Multer.File, 
    folder: string = 'products'
  ): Promise<{ url: string; blobName: string }> {
    try {
      const fileExtension = file.originalname.split('.').pop()
      const blobName = `${folder}/${uuidv4()}.${fileExtension}`
      
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(blobName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        })
        
      if (error) throw error
      
      // ดึง Public URL กลับไป
      const { data: publicUrlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(blobName)
      
      return { url: publicUrlData.publicUrl, blobName }
    } catch (error) {
      console.error('Error uploading image to Supabase:', error)
      throw new Error('Failed to upload image')
    }
  }
  
  async deleteImage(blobName: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([blobName])
        
      if (error) throw error
    } catch (error) {
      console.error('Error deleting image from Supabase:', error)
      throw new Error('Failed to delete image')
    }
  }
  
  async deleteMultipleImages(blobNames: string[]): Promise<void> {
    if (!blobNames || blobNames.length === 0) return;
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove(blobNames)
        
      if (error) throw error
    } catch (error) {
      console.error('Error deleting multiple images from Supabase:', error)
      throw new Error('Failed to delete images')
    }
  }

  async generateSignedUrl(blobName: string, expiresInMinutes = 15): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(blobName, expiresInMinutes * 60)
        
      if (error) throw error
      
      return data.signedUrl
    } catch (error) {
      console.error('Error generating signed URL from Supabase:', error)
      throw new Error('Failed to generate signed url')
    }
  }
}

// ยังคงใช้ชื่อเดิมเพื่อไม่ให้กระทบกับการ import ในไฟล์อื่น
export const azureBlobService = new StorageService()
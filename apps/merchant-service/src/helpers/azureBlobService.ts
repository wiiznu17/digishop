import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'
import { v4 as uuidv4 } from 'uuid'
import { generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol, StorageSharedKeyCredential } from '@azure/storage-blob'


class AzureBlobService {
  private blobServiceClient: BlobServiceClient
  private containerClient: ContainerClient
  
  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || ""
    
    if (!connectionString) {
      throw new Error('Azure Storage connection string is not configured')
    }
    
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    this.containerClient = this.blobServiceClient.getContainerClient(containerName)
    
    this.initializeContainer()
  }
  
  private async initializeContainer() {
    try {
      // Create container if it doesn't exist
      await this.containerClient.createIfNotExists({
        access: 'blob' // Allow public read access to blobs
      })
    } catch (error) {
      console.error('Error initializing Azure Blob container:', error)
    }
  }
  
  async uploadImage(
    file: Express.Multer.File, 
    folder: string = 'products'
  ): Promise<{ url: string; blobName: string }> {
    try {
      const fileExtension = file.originalname.split('.').pop()
      const blobName = `${folder}/${uuidv4()}.${fileExtension}`
      
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName)
      
      // Upload file buffer to blob
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        }
      })
      
      const url = blockBlobClient.url
      
      return { url, blobName }
    } catch (error) {
      console.error('Error uploading image to Azure Blob:', error)
      throw new Error('Failed to upload image')
    }
  }
  
  async deleteImage(blobName: string): Promise<void> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName)
      await blockBlobClient.deleteIfExists()
    } catch (error) {
      console.error('Error deleting image from Azure Blob:', error)
      throw new Error('Failed to delete image')
    }
  }
  
  async deleteMultipleImages(blobNames: string[]): Promise<void> {
    try {
      await Promise.all(
        blobNames.map(blobName => this.deleteImage(blobName))
      )
    } catch (error) {
      console.error('Error deleting multiple images:', error)
      throw new Error('Failed to delete images')
    }
  }

  async generateSignedUrl(blobName: string, expiresInMinutes = 15): Promise<string> {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)

    const sasToken = generateBlobSASQueryParameters({
      containerName: this.containerClient.containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'), // read only
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      protocol: SASProtocol.Https
    }, sharedKeyCredential).toString()

    const blobClient = this.containerClient.getBlobClient(blobName)
    return `${blobClient.url}?${sasToken}`
  }

}

export const azureBlobService = new AzureBlobService()
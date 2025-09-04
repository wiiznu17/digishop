import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/middleware'
import { Product } from '@digishop/db/src/models/Product'
import { ProductImage } from '@digishop/db/src/models/ProductImage'
import { Store } from '@digishop/db/src/models/Store'
import { Category } from '@digishop/db/src/models/Category'
import { azureBlobService } from '../helpers/azureBlobService'
import { Op, sequelize } from '@digishop/db/src/db'

// Get all products with images
export const getAllProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("Fetching products for merchant ID:", req.user?.sub)
    
    const store = await Store.findOne({
      where: { userId: req.user?.sub },
      include: [
        {
          model: Product,
          as: 'products',
          attributes: [
            'id', 'storeId', 'name', 'description', 'price', 
            'categoryId', 'stockQuantity', 'status', 'createdAt', 'updatedAt'
          ],
          include: [
            {
              model: ProductImage,
              as: 'images',
              attributes: ['id', 'url', 'fileName', 'isMain', 'sortOrder'],
              order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
            }
          ]
        }
      ]
    })
    
    if (!store) {
      console.warn("No store found for merchant ID:", req.user?.sub)
      return res.status(404).json({ error: "No store found for this merchant" })
    }
    
    console.log("Fetched products with images:", store)
    return res.json({ products: store })
  } catch (error) {
    console.error("Error fetching products:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Create a new product with images
export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  const transaction = await sequelize.transaction()
  
  try {
    const productDataString = req.body.productData
    const files = req.files as Express.Multer.File[]
    
    console.log("Creating product with data:", productDataString)
    console.log("Files received:", files?.length || 0)
    
    if (!productDataString) {
      return res.status(400).json({ error: "Product data is required" })
    }
    
    const productData = JSON.parse(productDataString)
    
    // Find store
    const store = await Store.findOne({
      where: { userId: req.user?.sub }
    })
    
    if (!store) {
      await transaction.rollback()
      return res.status(404).json({ error: "Store not found for this merchant" })
    }
    
    // Create product
    const newProduct = await Product.create({
      ...productData,
      storeId: store.id
    }, { transaction })
    
    // Upload images if provided
    if (files && files.length > 0) {
      const imagePromises = files.map(async (file, index) => {
        try {
          const { url, blobName } = await azureBlobService.uploadImage(file, `products/${newProduct.id}`)
          
          return ProductImage.create({
            productId: newProduct.id,
            url,
            blobName,
            fileName: file.originalname,
            isMain: index === 0, // First image is main
            sortOrder: index
          }, { transaction })
        } catch (error) {
          console.error(`Error uploading image ${file.originalname}:`, error)
          throw error
        }
      })
      
      await Promise.all(imagePromises)
    }
    
    await transaction.commit()
    
    // Fetch the complete product with images
    const completeProduct = await Product.findByPk(newProduct.id, {
      include: [
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'url', 'fileName', 'isMain', 'order'],
          order: [['order', 'ASC']]
        }
      ]
    })
    
    return res.status(201).json(completeProduct)
  } catch (error) {
    await transaction.rollback()
    console.error("Error creating product:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Update an existing product with images
export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  const transaction = await sequelize.transaction()
  
  try {
    const productId = req.params.id
    const productDataString = req.body.productData
    const files = req.files as Express.Multer.File[]
    
    console.log("Updating product:", productId)
    console.log("New files:", files?.length || 0)
    
    if (!productDataString) {
      return res.status(400).json({ error: "Product data is required" })
    }
    
    const productData = JSON.parse(productDataString)
    
    // Find the product
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: ProductImage,
          as: 'images'
        }
      ]
    })
    
    if (!product) {
      await transaction.rollback()
      return res.status(404).json({ error: "Product not found" })
    }
    
    // Update product data
    await product.update(productData, { transaction })
    
    // Upload new images if provided
    if (files && files.length > 0) {
      const existingImagesCount = product.images?.length || 0
      
      const imagePromises = files.map(async (file, index) => {
        try {
          const { url, blobName } = await azureBlobService.uploadImage(file, `products/${productId}`)
          
          return ProductImage.create({
            productId: Number(productId),
            url,
            blobName,
            fileName: file.originalname,
            isMain: existingImagesCount === 0 && index === 0, // First image is main if no existing images
            sortOrder: existingImagesCount + index
          }, { transaction })
        } catch (error) {
          console.error(`Error uploading image ${file.originalname}:`, error)
          throw error
        }
      })
      
      await Promise.all(imagePromises)
    }
    
    await transaction.commit()
    
    // Fetch the updated product with images
    const updatedProduct = await Product.findByPk(productId, {
      include: [
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'url', 'fileName', 'isMain', 'order'],
          order: [['order', 'ASC']]
        }
      ]
    })
    
    return res.json(updatedProduct)
  } catch (error) {
    await transaction.rollback()
    console.error("Error updating product:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Delete a product and its images
export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  const transaction = await sequelize.transaction()
  
  try {
    const productId = req.params.id
    
    // Find the product with images
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: ProductImage,
          as: 'images'
        }
      ]
    })
    
    if (!product) {
      await transaction.rollback()
      return res.status(404).json({ error: "Product not found" })
    }
    
    // Delete images from Azure Blob Storage
    if (product.images && product.images.length > 0) {
      const blobNames = product.images.map(img => img.blobName)
      await azureBlobService.deleteMultipleImages(blobNames)
    }
    
    // Delete product (images will be deleted by cascade)
    await product.destroy({ transaction })
    
    await transaction.commit()
    
    return res.status(204).send()
  } catch (error) {
    await transaction.rollback()
    console.error("Error deleting product:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Delete a specific product image
export const deleteProductImage = async (req: AuthenticatedRequest, res: Response) => {
  const transaction = await sequelize.transaction()
  
  try {
    const { id: productId, imageId } = req.params
    
    const productImage = await ProductImage.findOne({
      where: {
        id: imageId,
        productId: productId
      }
    })
    
    if (!productImage) {
      await transaction.rollback()
      return res.status(404).json({ error: "Product image not found" })
    }
    
    // Delete from Azure Blob Storage
    await azureBlobService.deleteImage(productImage.blobName)
    
    // If this was the main image, set another image as main
    if (productImage.isMain) {
      const nextMainImage = await ProductImage.findOne({
        where: {
          productId: productId,
          id: { [Op.ne]: imageId }
        },
        order: [['order', 'ASC']]
      })
      
      if (nextMainImage) {
        await nextMainImage.update({ isMain: true }, { transaction })
      }
    }
    
    // Delete the image record
    await productImage.destroy({ transaction })
    
    await transaction.commit()
    
    return res.status(204).send()
  } catch (error) {
    await transaction.rollback()
    console.error("Error deleting product image:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Update product image (set as main, change order)
export const updateProductImage = async (req: AuthenticatedRequest, res: Response) => {
  const transaction = await sequelize.transaction()
  
  try {
    const { id: productId, imageId } = req.params
    const { isMain, sortOrder } = req.body
    
    const productImage = await ProductImage.findOne({
      where: {
        id: imageId,
        productId: productId
      }
    })
    
    if (!productImage) {
      await transaction.rollback()
      return res.status(404).json({ error: "Product image not found" })
    }
    
    // If setting as main image, unset other main images
    if (isMain === true) {
      await ProductImage.update(
        { isMain: false },
        {
          where: {
            productId: productId,
            id: { [Op.ne]: imageId }
          },
          transaction
        }
      )
      // inscrement other
      await ProductImage.increment(
        { sortOrder: 1 },
        {
          where: {
            productId: productId,
            id: { [Op.ne]: imageId }
          },
          transaction
        }
      )
    }
    
    // Update the image
    await productImage.update({ isMain, sortOrder }, { transaction })
    
    await transaction.commit()
    
    return res.json(productImage)
  } catch (error) {
    await transaction.rollback()
    console.error("Error updating product image:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
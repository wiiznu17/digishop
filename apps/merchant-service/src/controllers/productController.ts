import { Request, Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/middleware'
import { Product } from '@digishop/db/src/models/Product';
import { Store } from '@digishop/db/src/models/Store';
import { Category } from '@digishop/db/src/models/Category';

// Get all products
export const getAllProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("Fetching products for merchant ID:", req.user?.sub);
    const products = await Store.findOne({
      where: { userId: req.user?.sub }, // Assuming you have a merchantId field
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'storeId', 'name', 'description', 'price', 'categoryId', 'stockQuantity', 'status', 'createdAt', 'updatedAt'],
        }
      ]
    });
    if (!products) {
      console.warn("No products found for merchant ID:", req.user?.sub);
      return res.status(404).json({ error: "No products found for this merchant" });
    }
    console.log("Fetched products:", products);
    return res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Create a new product
export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productData: Product = req.body;
    console.log("Creating product with data:", productData);
    // Validate product data here if necessary

    const store = await Store.findOne({
      where: { userId: req.user?.sub }, // Assuming you have a merchantId field
    })
    if (!store) {
      return res.status(404).json({ error: "Store not found for this merchant" })
    }

    const newProduct = await Product.create({
      ...productData,
      storeId: store.id
    });

    return res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update an existing product
export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.id;
    const productData: Partial<Product> = req.body;

    // Find the product by ID
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update the product
    await product.update(productData);

    return res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Delete a product
export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.id;

    // Find the product by ID
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete the product
    await product.destroy();

    return res.status(204).send(); // No content
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
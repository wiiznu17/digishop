import { Product } from '@digishop/db/src/models/Product'
import { Op } from 'sequelize'
import { NextFunction, Request, Response } from 'express'
import { Category } from '@digishop/db/src/models/Category'
import { ProductImage } from '@digishop/db/src/models/ProductImage'
import { Store } from '@digishop/db/src/models/Store'
import { ProductStatus, StoreStatus } from '@digishop/db/src/types/enum'
import { ProductItem } from '@digishop/db/src/models/ProductItem'


export const searchProduct = async(req: Request , res: Response , next: NextFunction) => {
    const { query } = req.query
    try {
      
    const searchProduct = await Product.findAll({
      where: {
        [Op.and]: [
        { name: {[Op.like]: `%${query}%`}},
        { status: ProductStatus.ACTIVE}
        ]
      },
      attributes: ['id','uuid','name'],
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id','storeName']
        }
      ]
    });
    if (!searchProduct) {
      return res.status(404).json({ error: `${query} not found` });
    }
    return res.json({ data: searchProduct});
  } catch (error) {
    return res.status(500).json({ error: error });
  }  
}

export const getProduct = async(req: Request , res: Response,  next: NextFunction) => {
  const id  = req.params.id
  try {
    const productDetail = await Product.findOne({
      where: {
        [Op.and]: [
        { uuid: id},
        { status: ProductStatus.ACTIVE}
        ]
      },
      include: [
        {
          model: ProductItem,
          as: 'items',
          attributes: ['id','sku','image_url','price_minor','stock_quantity']
        },
        {
          model: Store,
          as: 'store',
          where: {status: StoreStatus.APPROVED },
          attributes: ['id','storeName','logoUrl','description'] 

        },
        {
          model: Category,
          as: 'category',
          attributes: ['id','name']
        }
      ],
      attributes: ['id', 'name','description']
    });
    if(!productDetail){
      return res.status(404).json({ error: `${id} not found` });
    }
    return res.json({data: productDetail})
  }catch (error){
    return res.status(500).json({ error: error})
  }
}
export const getAllProduct = async(req: Request , res: Response) => {
  
  try {
    const product = await Product.findAll()
    if(!product){
      return res.status(404).json({ error: `not found` });
    }
    return res.json({data: product})
  }catch (error){
    return res.status(500).json({ error: "Internal server error"})
  }
}

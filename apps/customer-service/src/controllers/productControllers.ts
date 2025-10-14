import { Op } from "sequelize";
import { NextFunction, Request, Response } from "express";
import { Product } from "@digishop/db/src/models/Product";
import { Category } from "@digishop/db/src/models/Category";
import { ProductImage } from "@digishop/db/src/models/ProductImage";
import { Store } from "@digishop/db/src/models/Store";
import { ProductItem } from "@digishop/db/src/models/ProductItem";
import { ProductItemImage } from "@digishop/db/src/models/ProductItemImage";
import { ProductConfiguration } from "@digishop/db/src/models/ProductConfiguration";
import { VariationOption } from "@digishop/db/src/models/VariationOption";
import { Variation } from "@digishop/db/src/models/Variation";
import { ProductStatus, StoreStatus } from "@digishop/db/src/types/enum";
import sequelize from "@digishop/db";

export const searchProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { query , page } = req.query;
  try {
    const productCount = await Product.count({
      where: {
        [Op.and]: [
          { name: {[Op.like]: `%${query}%`}},
          { status: ProductStatus.ACTIVE}
        ]
      }
    })
    let searchProduct
    if(page){
      searchProduct = await Product.findAll({
        where: {
          [Op.and]: [
          { name: {[Op.like]: `%${query}%`}},
          { status: ProductStatus.ACTIVE}
          ]
        },
        limit: 10,
        offset: 10 * (Number(page) - 1),
        attributes: ['id','uuid','name'],
        include: [
          {
            model: Category,
            as: 'category',
          },
          {
            model: ProductImage,
            as: 'images'
          },
          {
            model: ProductItem,
            as: 'items',
          },
          {
            model: Store,
            as: 'store',
          }
        ]
      });
    }
    // engine search
    if(!page){
      searchProduct = await Product.findAll({
        where: {
          [Op.and]: [
          { name: {[Op.like]: `%${query}%`}},
          { status: ProductStatus.ACTIVE}
          ]
        },
        limit: 10,
        attributes: ['name'],
      });
    }
    const searchStore = await Store.findAll({
      where: {
        storeName: {
          [Op.like]: `%${query}%`, 
        },
      },
      limit: 5
    });
    if (!searchProduct) {
      return res.status(404).json({ error: `${query} not found` });
    }
    return res.json({ product: searchProduct , productCount: productCount , store: searchStore });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};

export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  try {
    const productDetail = await Product.findOne({
      where: {
        [Op.and]: [{ uuid: id }, { status: ProductStatus.ACTIVE }],
      },
      include: [
        {
          model: ProductItem,
          as: "items",
          include: [
            {
              model: ProductConfiguration,
              as:'configurations',
              include: [
                {
                  model: VariationOption,
                  as: 'variationOption',
                  include: [
                    {
                      model: Variation,
                      as: 'variation',
                    }
                  ]
                }
              ]
            },
            {
              model: ProductItemImage,
              as: "productItemImage",
            },
          ],
        },
        {
          model: Store,
          as: "store",
          where: { status: StoreStatus.APPROVED },
        },
        {
          model: Category,
          as: "category",
        },
      ],
      attributes: ["id", "name", "description"],
    });
    const optionProduct = await Product.findOne({
      where: {
        [Op.and]: [{ uuid: id }, { status: ProductStatus.ACTIVE }],
      },
      attributes: ["id"],
      include: [
        {
          model: Variation,
          as: 'variations',
          attributes: ["id","uuid","productId","name"],
          include: [
            {
              model: VariationOption,
              as: 'options',
              attributes: ["id","variationId","value","sortOrder"]
            }
          ]
        }
      ]
    })
    if (!productDetail) {
      return res.status(404).json({ error: `${id} not found` });
    }
    return res.json({ data: productDetail , choices: optionProduct });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
};
export const getAllProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findAll({
      include: [
        {
          model: ProductItem,
          as: "items",
        },
      ],
    });
    if (!product) {
      return res.status(404).json({ error: `not found` });
    }
    return res.json({ data: product });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getProductDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const productData = await Product.findAll();
};

export const getStoreProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id
  try {
    const productData = await Store.findOne(
      { where : { uuid: id},
       include: [
        {
          model: Product,
          as: "products",
          include: [
            {
            model: ProductItem,
            as: "items",
            include: [{
                model: ProductItemImage,
                as: "productItemImage",
              },]
            },
            {
            model: Category,
            as: 'category',
          },
          {
            model: ProductImage,
            as: 'images'
          },
          ],
        },
      ]}
    )
    res.json({data: productData })
  } catch (error) {
    res.json({ error: error})
  }
}
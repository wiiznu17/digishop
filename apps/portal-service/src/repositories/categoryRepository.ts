import { Category, Product } from "@digishop/db";
import { Op } from "sequelize";

export class CategoryRepository {
  async findCategoryByUuid(uuid: string, transaction?: any) {
    return Category.findOne({ where: { uuid }, paranoid: true, transaction });
  }

  async findCategoryById(id: number, transaction?: any) {
    return Category.findByPk(id, { attributes: ["uuid"], transaction });
  }

  async findAllCategoriesParams(where: any, order: any, attributes: any) {
    return Category.findAll({ where, order, attributes });
  }

  async findAndCountCategories(where: any, order: any, limit: number, offset: number, attributes: any) {
    return Category.findAndCountAll({ where, order, limit, offset, attributes });
  }

  async findAllCategoriesByIds(ids: number[]) {
    return Category.findAll({ where: { id: { [Op.in]: ids } }, attributes: ["id", "uuid"] });
  }

  async suggestCategories(where: any, limit: number, order: any, attributes: any) {
    return Category.findAll({ where, limit, order, attributes });
  }

  async createCategory(payload: any, transaction: any) {
    return Category.create(payload, { transaction });
  }

  async softDeleteCategories(ids: number[], transaction: any) {
    return Category.destroy({ where: { id: { [Op.in]: ids } }, transaction });
  }

  async countProductsDirect(categoryId: number): Promise<number> {
    return Product.count({ where: { categoryId } });
  }

  async countProductsTotal(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    return Product.count({ where: { categoryId: { [Op.in]: ids } } });
  }

  async moveProducts(fromIds: number[], targetId: number, transaction: any) {
    return Product.update({ categoryId: targetId }, { where: { categoryId: { [Op.in]: fromIds } }, transaction });
  }

  async getAllCategoriesForTree() {
    return Category.findAll({
      where: { deletedAt: null },
      attributes: ["id", "uuid", "parentId"],
      paranoid: true
    });
  }
}

export const categoryRepository = new CategoryRepository();

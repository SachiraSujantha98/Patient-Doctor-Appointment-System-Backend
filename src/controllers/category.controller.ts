import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/category.model';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationOptions, createPaginatedResponse } from '../utils/pagination';

// Get all categories with pagination
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, page } = getPaginationOptions({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });

    const { count, rows } = await Category.findAndCountAll({
      limit,
      offset,
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      ...createPaginatedResponse(rows, count, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

// Create category
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      throw new AppError('Category already exists', 400);
    }

    const category = await Category.create({ name, description });

    res.status(201).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ where: { name } });
      if (existingCategory) {
        throw new AppError('Category name already exists', 400);
      }
    }

    await category.update({ name, description });

    res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    await category.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}; 
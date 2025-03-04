import { Router, RequestHandler } from 'express';
import {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Protect all routes
router.use(protect as RequestHandler);

// Public routes (accessible by both patients and doctors)
router.get('/', getCategories as RequestHandler);
router.get('/:id', getCategoryById as RequestHandler);

// Admin routes (accessible only by doctors)
router.post('/', restrictTo('doctor') as RequestHandler, createCategory as RequestHandler);
router.patch('/:id', restrictTo('doctor') as RequestHandler, updateCategory as RequestHandler);
router.delete('/:id', restrictTo('doctor') as RequestHandler, deleteCategory as RequestHandler);

export const categoryRoutes = router; 
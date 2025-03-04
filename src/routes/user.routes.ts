import { Router, RequestHandler } from 'express';
import { protect } from '../middlewares/auth';
import { User, UserInstance } from '../models/user.model';
import { AppError } from '../middlewares/errorHandler';
import { getDoctors, getCurrentUser } from '../controllers/user.controller';

const router = Router();

interface DoctorResponse {
  status: string;
  data: {
    doctors: UserInstance[];
  };
}

interface UserResponse {
  status: string;
  data: {
    user: UserInstance;
  };
}

// Get all doctors
const getDoctorsHandler: RequestHandler<unknown, DoctorResponse> = async (_req, res, next) => {
  try {
    const doctors = await User.findAll({
      where: { role: 'doctor' },
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });

    res.status(200).json({
      status: 'success',
      data: {
        doctors,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getCurrentUserHandler: RequestHandler<unknown, UserResponse> = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const userDetails = await User.findByPk((req.user as UserInstance).id, {
      attributes: { exclude: ['password'] },
    });

    if (!userDetails) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: userDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Public routes
router.get('/doctors', getDoctors as RequestHandler);
router.get('/doctors/available', getDoctors as RequestHandler);

// Protected routes
router.get('/me', protect as RequestHandler, getCurrentUser as RequestHandler);

export const userRoutes = router; 
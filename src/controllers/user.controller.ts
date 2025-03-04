import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { User, UserInstance } from '../models/user.model';
import { Appointment } from '../models/appointment.model';
import { Category } from '../models/category.model';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationOptions, createPaginatedResponse } from '../utils/pagination';

// Get all doctors with pagination and filtering
export const getDoctors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit, offset, page } = getPaginationOptions({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });

    const { categoryId, date, searchTerm } = req.query;

    // Base where clause for doctors
    const where: any = { 
      role: 'doctor',
      ...(searchTerm && {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      }),
    };

    // Find doctors
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'email'],
      include: [
        {
          model: Category,
          as: 'specialties',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          ...(categoryId ? { where: { id: categoryId } } : {}),
        },
      ],
      limit,
      offset,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
      distinct: true, // Important when using includes with pagination
    });

    // If date is provided, filter out doctors who have appointments at that time
    let availableDoctors = rows;
    if (date) {
      const appointmentDate = new Date(date as string);
      const doctorIds = rows.map(doctor => doctor.id).filter((id): id is string => id !== undefined);
      
      const appointmentsOnDate = await Appointment.findAll({
        where: {
          doctorId: { [Op.in]: doctorIds },
          appointmentDate: {
            [Op.between]: [
              new Date(appointmentDate.setHours(0, 0, 0, 0)),
              new Date(appointmentDate.setHours(23, 59, 59, 999)),
            ],
          },
          status: {
            [Op.in]: ['accepted', 'pending'],
          },
        },
      });

      // Filter out doctors who have appointments
      const busyDoctorIds = new Set(appointmentsOnDate.map(apt => apt.doctorId));
      availableDoctors = rows.filter(doctor => !busyDoctorIds.has(doctor.id!));
    }

    const paginatedResponse = createPaginatedResponse(
      availableDoctors,
      date ? availableDoctors.length : count,
      page,
      limit
    );

    res.status(200).json({
      status: 'success',
      data: paginatedResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const userDetails = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refreshToken'] },
      include: [
        {
          model: Category,
          as: 'specialties',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
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
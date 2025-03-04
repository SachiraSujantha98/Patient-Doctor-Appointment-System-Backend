import { Request, Response, NextFunction } from 'express';
import { Appointment, AppointmentInstance } from '../models/appointment.model';
import { User, UserInstance } from '../models/user.model';
import { Category } from '../models/category.model';
import { AppError } from '../middlewares/errorHandler';
import { SQS } from '@aws-sdk/client-sqs';
import { SES } from '@aws-sdk/client-ses';
import { getPaginationOptions, createPaginatedResponse } from '../utils/pagination';

const sqs = new SQS({ region: process.env.AWS_REGION });
const ses = new SES({ region: process.env.AWS_REGION });

interface AppointmentWithPatient extends AppointmentInstance {
  patient?: UserInstance;
}

// Create appointment
export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { doctorId, categoryId } = req.body;
    const patientId = req.user!.id!;

    // Check if doctor exists and is a doctor
    const doctor = await User.findOne({
      where: { id: doctorId, role: 'doctor' },
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      categoryId,
      status: 'pending',
    });

    // Get full appointment details
    const fullAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    });

    // Send notification to SQS
    await sqs.sendMessage({
      QueueUrl: process.env.SQS_QUEUE_URL!,
      MessageBody: JSON.stringify({
        type: 'NEW_APPOINTMENT',
        appointmentId: appointment.id,
        doctorId,
        patientId,
      }),
    });

    res.status(201).json({
      status: 'success',
      data: {
        appointment: fullAppointment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get doctor's appointments with pagination and filtering
export const getDoctorAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit, offset, page } = getPaginationOptions({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });

    const { status, categoryId } = req.query;

    // Build where clause
    const where: any = { doctorId: req.user!.id! };
    if (status) {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const { count, rows } = await Appointment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    const paginatedResponse = createPaginatedResponse(rows, count, page, limit);

    res.status(200).json({
      status: 'success',
      data: paginatedResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Get patient's appointments with pagination and filtering
export const getPatientAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit, offset, page } = getPaginationOptions({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });

    const { status, categoryId } = req.query;

    // Build where clause
    const where: any = { patientId: req.user!.id! };
    if (status) {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const { count, rows } = await Appointment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    const paginatedResponse = createPaginatedResponse(rows, count, page, limit);

    res.status(200).json({
      status: 'success',
      data: paginatedResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Accept appointment
export const updateAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { appointmentId } = req.params;
    const { appointmentDate, status } = req.body;

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, doctorId: req.user!.id! },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    }) as AppointmentWithPatient | null;

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Update appointment
    if (status) {
      appointment.status = status as 'accepted' | 'completed' | 'cancelled';
    }
    if (appointmentDate) {
      appointment.appointmentDate = appointmentDate;
    }
    await appointment.save();

    // Send email notification if status changed
    if (status) {
      await ses.sendEmail({
        Source: process.env.SENDER_EMAIL!,
        Destination: {
          ToAddresses: [appointment.patient!.email],
        },
        Message: {
          Subject: {
            Data: `Appointment ${status}`,
          },
          Body: {
            Text: {
              Data: `Your appointment for ${appointment.category!.name} has been ${status} by Dr. ${req.user!.lastName}${
                appointmentDate ? ` for ${appointmentDate}` : ''
              }`,
            },
          },
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        appointment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add prescription
export const addPrescription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { appointmentId } = req.params;
    const { prescription } = req.body;

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, doctorId: req.user!.id! },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
    }) as AppointmentWithPatient | null;

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Update appointment
    appointment.status = 'completed';
    appointment.prescription = prescription;
    await appointment.save();

    // Send email notification
    await ses.sendEmail({
      Source: process.env.SENDER_EMAIL!,
      Destination: {
        ToAddresses: [appointment.patient!.email],
      },
      Message: {
        Subject: {
          Data: 'Prescription Added',
        },
        Body: {
          Text: {
            Data: `Your prescription for ${appointment.category!.name} has been added by Dr. ${req.user!.lastName}. Please check your appointment details.`,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        appointment,
      },
    });
  } catch (error) {
    next(error);
  }
}; 
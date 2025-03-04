import { Router, RequestHandler } from 'express';
import {
  createAppointment,
  getDoctorAppointments,
  getPatientAppointments,
  updateAppointment,
  addPrescription,
} from '../controllers/appointment.controller';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Protect all routes after this middleware
router.use(protect as RequestHandler);

// Patient routes
router.post('/', restrictTo('patient') as RequestHandler, createAppointment as RequestHandler);
router.get('/patient', restrictTo('patient') as RequestHandler, getPatientAppointments as RequestHandler);

// Doctor routes
router.get('/doctor', restrictTo('doctor') as RequestHandler, getDoctorAppointments as RequestHandler);
router.patch('/:appointmentId', restrictTo('doctor') as RequestHandler, updateAppointment as RequestHandler);
router.post('/:appointmentId/prescription', restrictTo('doctor') as RequestHandler, addPrescription as RequestHandler);

export const appointmentRoutes = router; 
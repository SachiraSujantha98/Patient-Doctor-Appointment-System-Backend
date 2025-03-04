import { SQSEvent } from 'aws-lambda';
import { SES } from '@aws-sdk/client-ses';
import { User, UserInstance } from '../models/user.model';
import { Appointment, AppointmentInstance } from '../models/appointment.model';

const ses = new SES({ region: process.env.AWS_REGION });

interface AppointmentWithPatient extends AppointmentInstance {
  patient?: UserInstance;
}

interface NewAppointmentMessage {
  type: 'NEW_APPOINTMENT';
  appointmentId: string;
  doctorId: string;
  patientId: string;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body) as NewAppointmentMessage;

      switch (message.type) {
        case 'NEW_APPOINTMENT':
          await handleNewAppointment(message);
          break;
        // Add more cases for different notification types
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }
};

async function handleNewAppointment(message: NewAppointmentMessage) {
  const { appointmentId, doctorId } = message;

  // Get appointment details
  const appointment = await Appointment.findByPk(appointmentId, {
    include: [
      {
        model: User,
        as: 'patient',
        attributes: ['firstName', 'lastName', 'email'],
      },
    ],
  }) as AppointmentWithPatient | null;

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Get doctor details
  const doctor = await User.findByPk(doctorId);
  if (!doctor) {
    throw new Error('Doctor not found');
  }

  // Send email to doctor
  await ses.sendEmail({
    Source: process.env.SENDER_EMAIL!,
    Destination: {
      ToAddresses: [doctor.email],
    },
    Message: {
      Subject: {
        Data: 'New Appointment Request',
      },
      Body: {
        Text: {
          Data: `You have a new appointment request from ${appointment.patient!.firstName} ${
            appointment.patient!.lastName
          }. Please check your dashboard to accept or decline.`,
        },
      },
    },
  });
} 
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { User, UserInstance } from './user.model';
import { Category, CategoryInstance } from './category.model';

export interface AppointmentAttributes {
  id?: string;
  patientId: string;
  doctorId: string;
  categoryId: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  appointmentDate?: Date;
  prescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentInstance extends Model<AppointmentAttributes>, AppointmentAttributes {
  patient?: UserInstance;
  doctor?: UserInstance;
  category?: CategoryInstance;
}

export const Appointment = sequelize.define<AppointmentInstance>(
  'Appointment',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Category,
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    appointmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    prescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }
);

// Define associations
Appointment.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });
Appointment.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId' });
Appointment.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });

export default Appointment; 
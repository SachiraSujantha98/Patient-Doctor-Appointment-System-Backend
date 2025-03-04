import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface CategoryAttributes {
  id?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryInstance extends Model<CategoryAttributes>, CategoryAttributes {}

export const Category = sequelize.define<CategoryInstance>(
  'Category',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }
);

export default Category; 
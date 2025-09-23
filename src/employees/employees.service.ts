import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Employee } from '@prisma/client';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    this.logger.log(`Creating employee relationship - User ID: ${createEmployeeDto.userId}, Store ID: ${createEmployeeDto.storeId}`);

    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: createEmployeeDto.userId },
      });

      if (!user) {
        this.logger.warn(`Employee creation failed: User with ID ${createEmployeeDto.userId} not found`);
        throw new BadRequestException(`User with ID ${createEmployeeDto.userId} not found`);
      }

      // Verificar que la tienda existe
      const store = await this.prisma.store.findUnique({
        where: { id: createEmployeeDto.storeId },
      });

      if (!store) {
        this.logger.warn(`Employee creation failed: Store with ID ${createEmployeeDto.storeId} not found`);
        throw new BadRequestException(`Store with ID ${createEmployeeDto.storeId} not found`);
      }

      // Verificar que el usuario no esté ya empleado en esta tienda
      const existingEmployee = await this.prisma.employee.findFirst({
        where: {
          userId: createEmployeeDto.userId,
          storeId: createEmployeeDto.storeId,
          isActive: createEmployeeDto.isActive !== false, // Si isActive es false, permitir duplicados inactivos
        },
      });

      if (existingEmployee) {
        this.logger.warn(`Employee creation failed: User ${createEmployeeDto.userId} already has a relationship with store ${createEmployeeDto.storeId}`);
        throw new BadRequestException(`User already has a relationship with this store`);
      }

      const employee = await this.prisma.employee.create({
        data: createEmployeeDto,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Employee relationship created successfully - ID: ${employee.id}, User: ${user.name} (${user.email}), Store: ${store.name}, Active: ${employee.isActive}`);
      return employee;

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error creating employee relationship:`, error);
      throw new BadRequestException('Failed to create employee relationship');
    }
  }

  async findAll(): Promise<Employee[]> {
    this.logger.log('Fetching all employee relationships');

    try {
      const employees = await this.prisma.employee.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(`Found ${employees.length} employee relationships`);
      return employees;

    } catch (error) {
      this.logger.error('Error fetching all employee relationships:', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<any> {
    this.logger.log(`Fetching employee relationship by ID: ${id}`);

    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              address: true,
              category: true,
            },
          },
        },
      });

      if (!employee) {
        this.logger.warn(`Employee relationship with ID ${id} not found`);
        throw new NotFoundException(`Employee relationship with ID ${id} not found`);
      }

      this.logger.log(`Employee relationship found - ID: ${employee.id}, User: ${employee.user.name}, Store: ${employee.store.name}`);
      return employee;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching employee relationship ${id}:`, error);
      throw error;
    }
  }

  async findByUserId(userId: number): Promise<Employee[]> {
    this.logger.log(`Fetching employee relationships for user ID: ${userId}`);

    try {
      const employees = await this.prisma.employee.findMany({
        where: { userId },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              address: true,
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(`Found ${employees.length} employee relationships for user ${userId}`);
      return employees;

    } catch (error) {
      this.logger.error(`Error fetching employee relationships for user ${userId}:`, error);
      throw error;
    }
  }

  async findByStoreId(storeId: number): Promise<Employee[]> {
    this.logger.log(`Fetching active employee relationships for store ID: ${storeId}`);

    try {
      const employees = await this.prisma.employee.findMany({
        where: { storeId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          hireDate: 'desc',
        },
      });

      this.logger.log(`Found ${employees.length} active employee relationships for store ${storeId}`);
      return employees;

    } catch (error) {
      this.logger.error(`Error fetching employee relationships for store ${storeId}:`, error);
      throw error;
    }
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    this.logger.log(`Updating employee relationship ID: ${id} with data:`, updateEmployeeDto);

    try {
      // Verificar que la relación empleado existe
      const existingEmployee = await this.prisma.employee.findUnique({
        where: { id },
      });

      if (!existingEmployee) {
        this.logger.warn(`Employee relationship update failed: Employee relationship with ID ${id} not found`);
        throw new NotFoundException(`Employee relationship with ID ${id} not found`);
      }

      const updatedEmployee = await this.prisma.employee.update({
        where: { id },
        data: updateEmployeeDto,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Employee relationship updated successfully - ID: ${updatedEmployee.id}, Changes:`, updateEmployeeDto);
      return updatedEmployee;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error updating employee relationship ${id}:`, error);
      throw new BadRequestException('Failed to update employee relationship');
    }
  }

  async remove(id: number): Promise<Employee> {
    this.logger.log(`Deleting employee relationship ID: ${id}`);

    try {
      // Verificar que la relación empleado existe
      const existingEmployee = await this.prisma.employee.findUnique({
        where: { id },
      });

      if (!existingEmployee) {
        this.logger.warn(`Employee relationship deletion failed: Employee relationship with ID ${id} not found`);
        throw new NotFoundException(`Employee relationship with ID ${id} not found`);
      }

      const deletedEmployee = await this.prisma.employee.delete({
        where: { id },
      });

      this.logger.log(`Employee relationship deleted successfully - ID: ${deletedEmployee.id}, User: ${deletedEmployee.userId}, Store: ${deletedEmployee.storeId}`);
      return deletedEmployee;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting employee relationship ${id}:`, error);
      throw new BadRequestException('Failed to delete employee relationship');
    }
  }

  async deactivateEmployee(id: number): Promise<Employee> {
    this.logger.log(`Deactivating employee relationship ID: ${id}`);
    const result = await this.update(id, { isActive: false });
    this.logger.log(`Employee relationship deactivated successfully - ID: ${id}`);
    return result;
  }

  async activateEmployee(id: number): Promise<Employee> {
    this.logger.log(`Activating employee relationship ID: ${id}`);
    const result = await this.update(id, { isActive: true });
    this.logger.log(`Employee relationship activated successfully - ID: ${id}`);
    return result;
  }
}

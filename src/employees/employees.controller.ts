import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from '@prisma/client';
import { EmployeePermissionsGuard } from './guards/employee-permissions.guard';
import {
  RequireEmployeeRead,
  RequireEmployeeWrite,
  RequireEmployeeApprove,
  RequireEmployeeWriteAndApprove
} from './decorators/employee-permissions.decorator';
import { UseGuards } from '@nestjs/common';

@ApiTags('employees')
@Controller('api/employees')
@UseGuards(EmployeePermissionsGuard)
export class EmployeesController {
  private readonly logger = new Logger(EmployeesController.name);

  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @RequireEmployeeWrite()
  @ApiOperation({
    summary: 'Create employee relationship',
    description: 'Create a relationship between a user and a store, designating the user as an employee'
  })
  @ApiBody({
    type: CreateEmployeeDto,
    description: 'Employee relationship creation data'
  })
  @ApiResponse({
    status: 201,
    description: 'Employee relationship created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        userId: { type: 'number', example: 1 },
        storeId: { type: 'number', example: 1 },
        isActive: { type: 'boolean', example: true },
        hireDate: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
          }
        },
        store: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or user/store not found' })
  @ApiResponse({ status: 409, description: 'User already has a relationship with this store' })
  async create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    this.logger.log(`Creating employee relationship - User ID: ${createEmployeeDto.userId}, Store ID: ${createEmployeeDto.storeId}`);
    const result = await this.employeesService.create(createEmployeeDto);
    this.logger.log(`Employee relationship created successfully with ID: ${result.id}`);
    return result;
  }

  @Get()
  @RequireEmployeeRead()
  @ApiOperation({
    summary: 'Get all employee relationships',
    description: 'Retrieve a list of all employee-store relationships with user and store information'
  })
  @ApiResponse({
    status: 200,
    description: 'Employee relationships retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          userId: { type: 'number' },
          storeId: { type: 'number' },
          isActive: { type: 'boolean' },
          hireDate: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
            }
          },
          store: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
            }
          }
        }
      }
    }
  })
  async findAll(): Promise<Employee[]> {
    this.logger.log('Fetching all employee relationships');
    const result = await this.employeesService.findAll();
    this.logger.log(`Retrieved ${result.length} employee relationships`);
    return result;
  }

  @Get(':id')
  @RequireEmployeeRead()
  @ApiOperation({
    summary: 'Get employee relationship by ID',
    description: 'Retrieve detailed information about a specific employee-store relationship'
  })
  @ApiParam({
    name: 'id',
    description: 'Employee relationship ID',
    example: 1,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Employee relationship found successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        userId: { type: 'number' },
        storeId: { type: 'number' },
        isActive: { type: 'boolean' },
        hireDate: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
          }
        },
        store: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            address: { type: 'string' },
            category: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    this.logger.log(`Fetching employee relationship by ID: ${id}`);
    const result = await this.employeesService.findOne(id);
    this.logger.log(`Employee relationship retrieved - ID: ${result?.id}, User: ${result?.user ? result.user.name : 'Unknown'}`);
    return result;
  }

  @Get('user/:userId')
  @RequireEmployeeRead()
  @ApiOperation({
    summary: 'Get employee relationships by user ID',
    description: 'Retrieve all stores where a specific user has an employee relationship'
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 1,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'User employees retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          storeId: { type: 'number' },
          role: { type: 'string' },
          isActive: { type: 'boolean' },
          hireDate: { type: 'string', format: 'date-time' },
          permissions: { type: 'array', items: { type: 'string' } },
          store: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              address: { type: 'string' },
              category: { type: 'string' },
            }
          }
        }
      }
    }
  })
  async findByUserId(@Param('userId', ParseIntPipe) userId: number): Promise<Employee[]> {
    this.logger.log(`Fetching employee relationships for user ID: ${userId}`);
    const result = await this.employeesService.findByUserId(userId);
    this.logger.log(`Found ${result.length} employee relationships for user ${userId}`);
    return result;
  }

  @Get('store/:storeId')
  @RequireEmployeeRead()
  @ApiOperation({
    summary: 'Get active employee relationships by store ID',
    description: 'Retrieve all active employee-store relationships for a specific store'
  })
  @ApiParam({
    name: 'storeId',
    description: 'Store ID',
    example: 1,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Store employees retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          userId: { type: 'number' },
          role: { type: 'string' },
          isActive: { type: 'boolean' },
          hireDate: { type: 'string', format: 'date-time' },
          permissions: { type: 'array', items: { type: 'string' } },
          user: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
            }
          }
        }
      }
    }
  })
  async findByStoreId(@Param('storeId', ParseIntPipe) storeId: number): Promise<Employee[]> {
    this.logger.log(`Fetching active employee relationships for store ID: ${storeId}`);
    const result = await this.employeesService.findByStoreId(storeId);
    this.logger.log(`Found ${result.length} active employee relationships for store ${storeId}`);
    return result;
  }

  @Patch(':id')
  @RequireEmployeeWrite()
  @ApiOperation({
    summary: 'Update employee relationship',
    description: 'Update employee-store relationship details like active status'
  })
  @ApiParam({
    name: 'id',
    description: 'Employee relationship ID',
    example: 1,
    type: Number
  })
  @ApiBody({
    type: UpdateEmployeeDto,
    description: 'Employee relationship update data'
  })
  @ApiResponse({
    status: 200,
    description: 'Employee relationship updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        userId: { type: 'number' },
        storeId: { type: 'number' },
        isActive: { type: 'boolean' },
        hireDate: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
          }
        },
        store: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    this.logger.log(`Updating employee relationship ID: ${id} with data:`, updateEmployeeDto);
    const result = await this.employeesService.update(id, updateEmployeeDto);
    this.logger.log(`Employee relationship updated successfully - ID: ${result.id}`);
    return result;
  }

  @Delete(':id')
  @RequireEmployeeWrite()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete employee relationship',
    description: 'Permanently remove an employee-store relationship from the system'
  })
  @ApiParam({
    name: 'id',
    description: 'Employee relationship ID',
    example: 1,
    type: Number
  })
  @ApiResponse({ status: 204, description: 'Employee relationship deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee relationship not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Deleting employee relationship ID: ${id}`);
    await this.employeesService.remove(id);
    this.logger.log(`Employee relationship deleted successfully - ID: ${id}`);
  }

  @Patch(':id/deactivate')
  @RequireEmployeeApprove()
  @ApiOperation({
    summary: 'Deactivate employee relationship',
    description: 'Mark an employee-store relationship as inactive without deleting the record'
  })
  @ApiParam({
    name: 'id',
    description: 'Employee relationship ID',
    example: 1,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Employee relationship deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        isActive: { type: 'boolean', example: false },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Employee relationship not found' })
  async deactivateEmployee(@Param('id', ParseIntPipe) id: number): Promise<Employee> {
    this.logger.log(`Deactivating employee relationship ID: ${id}`);
    const result = await this.employeesService.deactivateEmployee(id);
    this.logger.log(`Employee relationship deactivated successfully - ID: ${id}`);
    return result;
  }

  @Patch(':id/activate')
  @RequireEmployeeApprove()
  @ApiOperation({
    summary: 'Activate employee relationship',
    description: 'Reactivate a previously deactivated employee-store relationship'
  })
  @ApiParam({
    name: 'id',
    description: 'Employee relationship ID',
    example: 1,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Employee relationship activated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        isActive: { type: 'boolean', example: true },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Employee relationship not found' })
  async activateEmployee(@Param('id', ParseIntPipe) id: number): Promise<Employee> {
    this.logger.log(`Activating employee relationship ID: ${id}`);
    const result = await this.employeesService.activateEmployee(id);
    this.logger.log(`Employee relationship activated successfully - ID: ${id}`);
    return result;
  }
}

import { IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignPermissionsDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  permissionCodes: string[];
}

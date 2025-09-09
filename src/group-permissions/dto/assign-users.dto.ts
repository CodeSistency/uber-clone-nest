import { IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignUsersDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  userIds: number[];
}

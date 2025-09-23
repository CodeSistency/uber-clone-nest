import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Admin } from '../../admin/entities/admin.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Admin => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':userId/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async avatarUpload(@UploadedFile() file) {
    return;
  }
}

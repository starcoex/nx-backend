import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Packages } from '@nx-backend/grpc';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    // ClientsModule.registerAsync([
    //   {
    //     name: Packages.NOTIFICATIONS,
    //     useFactory: (configService: ConfigService) => ({
    //       transport: Transport.GRPC,
    //       options: {
    //         url: configService.getOrThrow('NOTIFICATIONS_GRPC_URL'),
    //         package: Packages.NOTIFICATIONS,
    //         protoPath: join(
    //           __dirname,
    //           '../../libs/grpc/proto/notifications.proto'
    //         ),
    //       },
    //     }),
    //     inject: [ConfigService],
    //   },
    // ]),
  ],
  providers: [UsersResolver, UsersService, JwtService],
  exports: [UsersService],
})
export class UsersModule {}

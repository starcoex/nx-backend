import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.straegty';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [ConfigModule, JwtModule, UsersModule],
  controllers: [AuthController],
  providers: [
    AuthResolver,
    AuthService,
    PrismaService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
})
export class AuthModule {}

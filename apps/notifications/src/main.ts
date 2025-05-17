/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
require('module-alias/register');
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { Logger as PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { Packages } from '@nx-backend/grpc';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.use(cookieParser());
  app.useLogger(app.get(PinoLogger));

  const port = app.get(ConfigService).getOrThrow('NOTIFICATIONS_PORT') || 4002;
  app.connectMicroservice<GrpcOptions>({
    transport: Transport.GRPC,
    options: {
      url: app.get(ConfigService).getOrThrow('NOTIFICATIONS_GRPC_URL'),
      package: Packages.NOTIFICATIONS,
      protoPath: join(__dirname, '../../libs/grpc/proto/notifications.proto'),
    },
  });
  await app.startAllMicroservices();
  await app.listen(port);
  app
    .get(PinoLogger)
    .log(
      `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
    );
}

bootstrap();

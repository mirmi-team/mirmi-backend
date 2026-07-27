import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Mirmi API')
    .setDescription('미림 기숙사 서비스 API 문서')
    .setVersion('1.0')
    .addBearerAuth() // JWT 토큰 인증 추가
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // /api-docs 경로
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

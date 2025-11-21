import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const rawOrigins = process.env.CORS_ORIGINS?.split(',');
  const origins = rawOrigins?.map((origin) => origin.trim());

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  const port = process.env.PORT;

  if (!port) {
    throw new Error('PORT is not set');
  }

  await app.listen(port);

  console.log(`Server is running on: http://localhost:${port}`);
  console.log(`GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

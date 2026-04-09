import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Appout")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  app.enableCors({
    origin: [
      "https://www.appoutz.com",
      "https://appoutz.com",
      "https://www.appoutz.com.br",
      "https://appoutz.com.br",
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000, "0.0.0.0");

  console.log("🚀 App rodando na porta:", process.env.PORT);
}
bootstrap();

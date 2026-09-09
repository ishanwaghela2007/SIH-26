import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { LanguageController } from './language/language.controller';
import { LanguageService } from './language/language.service';
import { OllamaClient } from './language/ollama.client';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  controllers: [LanguageController],
  providers: [LanguageService, OllamaClient],
})
export class AppModule {}

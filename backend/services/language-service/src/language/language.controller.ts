import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DetectLanguageDto } from './dto/detect.dto';
import { TranslateDto } from './dto/translate.dto';
import { UnderstandDto } from './dto/understand.dto';
import { LanguageService } from './language.service';
import { OllamaClient } from './ollama.client';

@Controller('language')
export class LanguageController {
  constructor(
    private readonly languageService: LanguageService,
    private readonly ollama: OllamaClient,
  ) {}

  @Post('detect')
  @UseGuards(AuthGuard)
  detect(@Body() dto: DetectLanguageDto) {
    return this.languageService.detect(dto.text);
  }

  @Post('translate')
  @UseGuards(AuthGuard)
  translate(@Body() dto: TranslateDto) {
    return this.languageService.translate(
      dto.text,
      dto.targetLanguage,
      dto.sourceLanguage,
      dto.context,
    );
  }

  @Post('understand')
  @UseGuards(AuthGuard)
  understand(@Body() dto: UnderstandDto) {
    return this.languageService.understand(dto.text, dto.language);
  }

  @Get('ready')
  async ready() {
    return {
      service: 'language-service',
      ollama: await this.ollama.isReady(),
      model: this.ollama.getModel(),
    };
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './api/api.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/payever'), ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

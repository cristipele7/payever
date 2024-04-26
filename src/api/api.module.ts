import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { HttpModule } from '@nestjs/axios';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
    MailerModule.forRoot({
      transport: {
        host: '',
        secure: false,
        auth: {
          user: '',
          pass: '',
        },
      },
      defaults: {
        from: '',
      },
    }),
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}

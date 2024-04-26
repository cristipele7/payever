import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiService } from './api.service';
import { UserDto } from './api.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { MailerService } from '@nestjs-modules/mailer';
import amqp, { Connection } from 'amqplib';

@Controller('api')
export class ApiController {
  constructor(
    private readonly apiService: ApiService,
    private readonly mailerService: MailerService,
  ) {}

  @Post('users')
  @UseInterceptors(FileInterceptor('file'))
  async createUser(
    @Body() body: UserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const existsUser = await this.apiService.existsUser({
      $or: [{ userId: body.userId }, { email: body.email }],
    });
    if (existsUser) {
      throw new BadRequestException(
        `User with userId ${body.userId} or email ${body.email} already exists!`,
      );
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('No file!');
    }

    body.avatar = Buffer.from(file.buffer).toString('base64');
    const user = await this.apiService.createUser(body);

    const text = 'Your user was created successfully!';
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'User created',
        text,
      });
    } catch (err) {
      console.log('Error sending email');
    }

    let connection: Connection;
    try {
      connection = await amqp.connect('amqp://localhost');

      const channel = await connection.createChannel();
      await channel.assertQueue('messageQueue', { durable: false });
      channel.sendToQueue('messageQueue', Buffer.from(JSON.stringify(text)));
      await channel.close();
    } catch (err) {
      console.log('Error sending message');
    } finally {
      if (connection) {
        await connection.close();
      }
    }

    return user;
  }

  @Get('user/:userId')
  async getUser(@Param('userId') userId: number) {
    return this.apiService.getUser(userId);
  }

  @Get('user/:userId/avatar')
  async getUserAvatar(@Param('userId') userId: string) {
    const existsUser = await this.apiService.existsUser({
      userId,
    });
    if (!existsUser) {
      throw new BadRequestException(`User does not exists!`);
    }

    const avatar = await this.apiService.getUserAvatar(userId);
    if (!avatar) {
      throw new BadRequestException(`User does not have an avatar!`);
    }

    return { avatar };
  }

  @Delete('user/:userId/avatar')
  async deleteUserAvatar(@Param('userId') userId: string) {
    const existsUser = await this.apiService.existsUser({
      userId,
    });
    if (!existsUser) {
      throw new BadRequestException(`User does not exists!`);
    }

    await this.apiService.deleteUserAvatar(userId);
    return 'Successfully deleted avatar';
  }
}

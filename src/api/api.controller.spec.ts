import { Test, TestingModule } from '@nestjs/testing';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { UserDto } from './api.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException } from '@nestjs/common';

describe('ApiController', () => {
  let controller: ApiController;
  let service: ApiService;

  const userData: UserDto = {
    userId: '1',
    email: 'user1@user1.com',
    password: 'password1',
    avatar: 'avatar1.jpg',
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiController],
      providers: [
        {
          provide: ApiService,
          useValue: {
            existsUser: jest
              .fn<Promise<boolean>, string[]>()
              .mockImplementation(() => Promise.resolve(false)),
            createUser: jest
              .fn<Promise<UserDto>, string[]>()
              .mockImplementation(() => Promise.resolve(userData)),
            getUser: jest
              .fn<Promise<UserDto>, string[]>()
              .mockImplementation(() => Promise.resolve(userData)),
            getUserAvatar: jest
              .fn<Promise<string>, string[]>()
              .mockImplementation(() => Promise.resolve(userData.avatar)),
            deleteUserAvatar: jest
              .fn<Promise<string>, string[]>()
              .mockImplementation(() =>
                Promise.resolve('Successfully deleted avatar'),
              ),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ApiController>(ApiController);
    service = module.get<ApiService>(ApiService);
  });

  const fileData: Express.Multer.File = {
    fieldname: 'avatar1.jpg',
    originalname: 'avatar1.jpg',
    encoding: 'ascii',
    mimetype: 'image',
    size: 1,
    filename: 'avatar1.jpg',
    path: 'avatar1.jpg',
    buffer: Buffer.from('avatar1.jpg'),
    stream: null,
    destination: 'avatar1.jpg',
  };
  describe('createUser', () => {
    it('user exists', async () => {
      const existsUser = jest
        .spyOn(service, 'existsUser')
        .mockImplementationOnce(() => Promise.resolve(true));

      try {
        await controller.createUser(userData, fileData);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.toString()).toMatch(
          'User with userId 1 or email user1@user1.com already exists!',
        );
      }
      expect(existsUser).toHaveBeenCalledTimes(1);
    });

    it('no file', async () => {
      try {
        await controller.createUser(userData, null);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.toString()).toMatch('No file!');
      }
    });

    it('return user data', async () => {
      expect(await controller.createUser(userData, fileData)).toStrictEqual(
        userData,
      );
    });
  });

  describe('getUser', () => {
    it('return user data', async () => {
      expect(await controller.getUser(1)).toStrictEqual(userData);
    });
  });

  describe('getUserAvatar', () => {
    it('user not exists', async () => {
      try {
        await controller.getUserAvatar(userData.userId);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.toString()).toMatch('User does not exists!');
      }
    });

    it('user does not have an avatar', async () => {
      const existsUser = jest
        .spyOn(service, 'existsUser')
        .mockImplementationOnce(() => Promise.resolve(true));

      const getUserAvatar = jest
        .spyOn(service, 'getUserAvatar')
        .mockImplementationOnce(() => Promise.resolve(null));

      try {
        await controller.getUserAvatar(userData.userId);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.toString()).toMatch('User does not have an avatar!');
      }
      expect(existsUser).toHaveBeenCalledTimes(1);
      expect(getUserAvatar).toHaveBeenCalledTimes(1);
    });

    it('return user avatar', async () => {
      const existsUser = jest
        .spyOn(service, 'existsUser')
        .mockImplementationOnce(() => Promise.resolve(true));

      expect(await controller.getUserAvatar(userData.userId)).toStrictEqual({
        avatar: userData.avatar,
      });
      expect(existsUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteUserAvatar', () => {
    it('user not exists', async () => {
      try {
        await controller.deleteUserAvatar(userData.userId);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect(e.toString()).toMatch('User does not exists!');
      }
    });

    it('return successfully deleted avatar', async () => {
      const existsUser = jest
        .spyOn(service, 'existsUser')
        .mockImplementationOnce(() => Promise.resolve(true));

      expect(await controller.deleteUserAvatar(userData.userId)).toStrictEqual(
        'Successfully deleted avatar',
      );
      expect(existsUser).toHaveBeenCalledTimes(1);
    });
  });
});

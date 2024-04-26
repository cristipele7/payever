import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ApiService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly httpService: HttpService,
  ) {}

  async existsUser(query: FilterQuery<User>): Promise<boolean> {
    const userData = await this.userModel.findOne(query).exec();
    return !!userData;
  }

  async createUser(user: any): Promise<User> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async getUser(userId: number): Promise<string> {
    const userData = await this.httpService.axiosRef.get(
      `https://reqres.in/api/users/${userId}`,
    );
    return JSON.stringify(userData.data);
  }

  async getUserAvatar(userId: string): Promise<string> {
    const userData = await this.userModel
      .findOne({
        userId,
      })
      .exec();
    return userData.avatar;
  }

  async deleteUserAvatar(userId: string) {
    await this.userModel
      .updateOne(
        {
          userId,
        },
        {
          $set: {
            avatar: null,
          },
        },
      )
      .exec();
  }
}

import { Query, Resolver } from '@nestjs/graphql';
import { UserService } from './users.service';
import { UserResponse } from './models/user.model';

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => UserResponse)
  getUser(): Promise<UserResponse> {
    return this.userService.getUser();
  }
}

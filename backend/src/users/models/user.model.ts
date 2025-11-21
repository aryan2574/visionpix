import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserResponse {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  message?: string;
}

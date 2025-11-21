import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class FileInput {
  @Field()
  fileName: string;

  @Field()
  mime: string;

  @Field(() => Int)
  sizeBytes: number;
}

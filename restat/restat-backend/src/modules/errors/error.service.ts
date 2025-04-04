import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ErrorDto } from "./dto/error.dto";
import { Errors } from "src/common/models/errors.model";
import { errorsMessages } from "src/common/constants/messages";
import { Users } from "src/common/models/users.model";

@Injectable()
export class ErrorService {
  constructor(
  ) { }
  public async createError(
    { errorDto, user }: { errorDto: ErrorDto, user: Users }
  ) {
    const {
      error,
    } = errorDto;
    try {
      const theError = await Errors.create({
        error,
        userId: user.id
      });
      return {
        message: errorsMessages.errorCreated,
        theError,
      };
    } catch (err) {
      console.error("err is........", err)
      throw new InternalServerErrorException(
        errorsMessages.errorCreatingError
      );
    }
  }

  public async getAllErrors() {
    try {
      const errors = await Errors.findAll()
      return {
        errors
      }
    } catch (err) {
      console.error("err is.....", err)
      throw new InternalServerErrorException(errorsMessages.errorRetrievedError)
    }
  }
}

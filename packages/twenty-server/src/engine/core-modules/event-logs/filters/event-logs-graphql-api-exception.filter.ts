import { Catch, type ExceptionFilter } from '@nestjs/common';
import { GraphQLError } from 'graphql';

import {
  EventLogsException,
  EventLogsExceptionCode,
} from 'src/engine/core-modules/event-logs/event-logs.exception';

@Catch(EventLogsException)
export class EventLogsGraphqlApiExceptionFilter implements ExceptionFilter {
  catch(exception: EventLogsException): never {
    throw new GraphQLError(exception.message, {
      extensions: {
        code: exception.code ?? EventLogsExceptionCode.INVALID_FIELD_FILTER,
      },
    });
  }
}

import { Catch, type ExceptionFilter } from '@nestjs/common';

// Nothing raises this. The class used to be a catch-all proxy whose catch()
// returned without a response, so the request waited until the test timed out.
class EmailGroupAccessException extends Error {}

@Catch(EmailGroupAccessException)
export class EmailGroupAccessGraphqlApiExceptionFilter implements ExceptionFilter {
  catch(_exception: EmailGroupAccessException): void {
    return;
  }
}

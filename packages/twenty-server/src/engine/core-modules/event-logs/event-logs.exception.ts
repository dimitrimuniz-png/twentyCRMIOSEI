export enum EventLogsExceptionCode {
  INVALID_FIELD_FILTER = 'INVALID_FIELD_FILTER',
}

export class EventLogsException extends Error {
  code: EventLogsExceptionCode;

  constructor(message: string, code: EventLogsExceptionCode) {
    super(message);
    this.code = code;
  }
}

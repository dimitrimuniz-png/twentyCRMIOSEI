import { Injectable } from '@nestjs/common';

// Custom AI providers above the complimentary seat threshold need the commercial
// key check. This fork does not grant that access.
@Injectable()
export class CustomAiProviderAccessService {
  getCachedHasAccess(): boolean {
    return false;
  }
}

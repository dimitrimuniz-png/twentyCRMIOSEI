import { Injectable } from '@nestjs/common';

// The commercial key and validity-token checks are not part of this fork.
// These methods stay negative so the workspace cap and other gates remain closed.
@Injectable()
export class EnterprisePlanService {
  isValid(): boolean {
    return false;
  }

  hasValidSignedEnterpriseKey(): boolean {
    return false;
  }

  hasValidEnterpriseValidityToken(): boolean {
    return false;
  }
}

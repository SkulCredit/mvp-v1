import { LendsqrBaseService } from './base.service';

class LendsqrIdentityService extends LendsqrBaseService {
  verifyBvn(bvn: string): Promise<unknown> {
    return this.client.get(`/v1/verification/bvn/${bvn}`);
  }

  verifyNin(nin: string): Promise<unknown> {
    return this.client.get(`/v1/verification/nin/${nin}`);
  }
}

export default new LendsqrIdentityService();

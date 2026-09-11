import { LendsqrBaseService } from './base.service';

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bvn: string;
}

class LendsqrCustomerService extends LendsqrBaseService {
  createCustomer(customerData: CustomerData): Promise<unknown> {
    return this.client.post('/v1/customers', {
      first_name:   customerData.firstName,
      last_name:    customerData.lastName,
      email:        customerData.email,
      phone_number: customerData.phoneNumber,
      bvn:          customerData.bvn,
    });
  }

  getCustomer(customerId: string): Promise<unknown> {
    return this.client.get(`/v1/customers/${customerId}`);
  }

  updateCustomer(customerId: string, updateData: Record<string, unknown>): Promise<unknown> {
    return this.client.put(`/v1/customers/${customerId}`, updateData);
  }
}

export default new LendsqrCustomerService();

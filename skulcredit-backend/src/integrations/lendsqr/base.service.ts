import axios, { AxiosInstance } from 'axios';
import env from '../../config/env';
import logger from '../../config/logger';
import ApiError from '../../utils/apiError';

export class LendsqrBaseService {
  protected client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.lendsqr.baseUrl,
      headers: {
        Authorization: `Bearer ${env.lendsqr.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        logger.error('Lendsqr API Error:', error.response?.data ?? error.message);
        throw new ApiError(
          error.response?.status ?? 500,
          error.response?.data?.message ?? 'Lendsqr Integration Error'
        );
      }
    );
  }
}

/**
 * Local development provider — lets you run the full checkout without PSP credentials.
 * Disabled automatically when NODE_ENV=production.
 */
import config from '../config.js';

export default {
  name: 'mock',
  label: 'Test payment (development only)',
  isConfigured() {
    return !config.isProd;
  },
  async createPayment({ order }) {
    return { sessionId: `mock_${order.id}`, client: { type: 'mock' } };
  },
};

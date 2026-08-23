import { CustomerRepository } from "../repositories/customer.repository.js";

export class CustomerService {
  static async getProfile(customerId: string) {
    return await CustomerRepository.getProfile(customerId);
  }

  static async updateProfile(customerId: string, payload: { full_name?: string; phone?: string }) {
    return await CustomerRepository.updateProfile(customerId, payload);
  }

  static async getAddresses(customerId: string) {
    return await CustomerRepository.getAddresses(customerId);
  }

  static async createAddress(customerId: string, payload: Record<string, unknown>) {
    return await CustomerRepository.createAddress(customerId, payload);
  }

  static async deleteAddress(id: string, customerId: string) {
    return await CustomerRepository.deleteAddress(id, customerId);
  }

  static async submitReview(payload: {
    product_id: string;
    customer_id: string;
    rating: number;
    title: string;
    comment: string;
  }) {
    return await CustomerRepository.submitReview(payload);
  }
}

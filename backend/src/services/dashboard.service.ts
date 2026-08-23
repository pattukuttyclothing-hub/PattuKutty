import { DashboardRepository } from "../repositories/dashboard.repository.js";

export class DashboardService {
  static async getDashboard() {
    return await DashboardRepository.getDashboardSummary();
  }

  static async getAdminProfile(userId: string) {
    return await DashboardRepository.getAdminProfile(userId);
  }
}

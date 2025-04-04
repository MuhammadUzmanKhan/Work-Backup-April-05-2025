export class DashboardAdapter {
  static mapDashboardDtoToDashboardModel({
    id,
    healthDataConnected,
    points,
    profileCompletionPercentage
  }) {
    return {
      id: id || '',
      healthDataConnected: healthDataConnected || false,
      points: points || [],
      profileCompletionPercentage: profileCompletionPercentage || 0
    };
  }
}

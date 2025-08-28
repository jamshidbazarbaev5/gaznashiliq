import appealsService from './appeals';
import authService from './auth';
import notificationsService from './notifications';

class ApiManager {
  private tokenExpirationHandler?: () => Promise<void>;

  setTokenExpirationHandler(handler: () => Promise<void>) {
    this.tokenExpirationHandler = handler;

    // Set the handler for all API services
    appealsService.setTokenExpirationHandler(handler);
    authService.setTokenExpirationHandler(handler);
    notificationsService.setTokenExpirationHandler(handler);
  }

  async handleTokenExpiration() {
    if (this.tokenExpirationHandler) {
      try {
        await this.tokenExpirationHandler();
      } catch (error) {
        console.error('Error handling token expiration:', error);
      }
    }
  }
}

const apiManager = new ApiManager();
export default apiManager;

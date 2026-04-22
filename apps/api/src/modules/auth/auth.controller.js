const { authService } = require("./auth.service");

function createAuthController(service = authService) {
  return {
    async login(req, res, next) {
      try {
        const data = await service.login(req.body);
        res.json({
          success: true,
          data
        });
      } catch (error) {
        next(error);
      }
    },

    async me(req, res, next) {
      try {
        const data = await service.getCurrentUser(req.user?.userId);
        res.json({
          success: true,
          data
        });
      } catch (error) {
        next(error);
      }
    },

    async requestReset(req, res, next) {
      try {
        const data = await service.requestReset(req.body);
        res.json({
          success: true,
          data
        });
      } catch (error) {
        next(error);
      }
    },

    async resetPassword(req, res, next) {
      try {
        const data = await service.resetPassword(req.body);
        res.json({
          success: true,
          data
        });
      } catch (error) {
        next(error);
      }
    }
  };
}

const authController = createAuthController();

module.exports = {
  authController,
  createAuthController
};

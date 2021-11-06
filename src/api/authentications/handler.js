const ClientError = require('../../exceptions/ClientError');

class AuthenticationsHandler {
    constructor(authenticationsService, usersService, tokenManager, validator) {
      this._authenticationsService = authenticationsService;
      this._usersService = usersService;
      this._tokenManager = tokenManager;
      this._validator = validator;

      this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
      this.putAuthenticationHandler = this.putAuthenticationHandler.bind(this);
      this.deleteAuthenticationHandler = this.deleteAuthenticationHandler.bind(this);
    }

    // post authentication handler
    async postAuthenticationHandler(request, h) {
      try {
        this._validator.validatePostAuthenticationPayload(request.payload);

        const { username, password } = request.payload;
        
        // check credential 
        const id = await this._usersService.verifyUserCredential(username, password);

        // generate acces token and refresh token
        const accessToken = this._tokenManager.generateAccessToken({ id });
        const refreshToken = this._tokenManager.generateRefreshToken({ id });

        await this._authenticationsService.addRefreshToken(refreshToken);

        const response = h.response({
          status: 'success',
          message: 'Authentication added successfully.',
          data: {
            accessToken,
            refreshToken,
          },
        });

        response.code(201);
        return response;
      } catch (error) {
        if (error instanceof ClientError) {
          const response = h.response({
            status: 'fail',
            message: error.message,
          });
          response.code(error.statusCode);
          return response;
        }
    
        const response = h.response({
          status: 'error',
          message: 'Sorry, there was a failure on our server.',
        });

        response.code(500);
        console.error(error);
        return response;
      }
    }

    async putAuthenticationHandler(request, h) {
        try {
          this._validator.validatePutAuthenticationPayload(request.payload);

          const { refreshToken } = request.payload;

          // verification refresh token from database and signature token 
          await this._authenticationsService.verifyRefreshToken(refreshToken);
          const { id } = this._tokenManager.verifyRefreshToken(refreshToken);

          // create new access token
          const accessToken = this._tokenManager.generateAccessToken({ id });

          return {
            status: 'success',
            message: 'Access Token successfully updated.',
            data: {
              accessToken,
            },
          };
        } catch (error) {
          if (error instanceof ClientError) {
            const response = h.response({
              status: 'fail',
              message: error.message,
            });
            response.code(error.statusCode);
            return response;
          }
     
          const response = h.response({
            status: 'error',
            message: 'Sorry, there was a failure on our server.',
          });

          response.code(500);
          console.error(error);
          return response;
        }
    }

    async deleteAuthenticationHandler(request, h) {
        try {
          this._validator.validateDeleteAuthenticationPayload(request.payload);

          const { refreshToken } = request.payload;

          // check refresh token from database there is or not
          await this._authenticationsService.verifyRefreshToken(refreshToken);

          // delete refresh token from database
          await this._authenticationsService.deleteRefreshToken(refreshToken);

          return {
            status: 'success',
            message: 'Refresh token deleted successfully.',
          };
        } catch (error) {
          if (error instanceof ClientError) {
            const response = h.response({
              status: 'fail',
              message: error.message,
            });
            response.code(error.statusCode);
            return response;
          }
     
          const response = h.response({
            status: 'error',
            message: 'Sorry, there was a failure on our server.',
          });
          response.code(500);
          console.error(error);
          return response;
        }
    }
}

module.exports = AuthenticationsHandler;

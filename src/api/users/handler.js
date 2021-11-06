const ClientError = require('../../exceptions/ClientError');

class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postUserHandler = this.postUserHandler.bind(this);
  }

  async postUserHandler(request, h) {
    try {
      // validate payload
      this._validator.validateUserPayload(request.payload);

      const {role, name, username, email, password} = request.payload;

      const userId = await this._service.addUser({role, name, username, email, password});

      const response = h.response({
        status: 'success',
        message: 'Successfully added user.',
        data: {
          userId,
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
}

module.exports = UsersHandler;

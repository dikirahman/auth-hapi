require('dotenv').config();

const Hapi = require('@hapi/hapi');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOTS,
    routes: {
      cors: {
        origin: ['*'],
      }
    }
  });

  await server.start();

  console.log(`Server running on ${server.info.uri}`)
};

init();

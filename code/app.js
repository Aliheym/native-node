const http = require('http');
const mongoose = require('mongoose');

require('dotenv').config();
require('./routes');

const Router = require('./routes/Router');

function startServer() {
  const server = http.createServer((req, res) => {
    Router.set(req, res).route();
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Listening on port ${port}...`);
  });
}

async function bootstrap() {
  const connectionURL = `mongodb://${process.env.MONGO_HOST}:27017/${process.env.MONGO_DB_NAME}`;

  try {
    await mongoose.connect(connectionURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    startServer();
  } catch (err) {
    process.exit(1);
  }
}

bootstrap();

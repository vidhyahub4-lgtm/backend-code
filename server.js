const connectDB = require('./src/config/db');
const errorHandler = require('./src/errorHandlers/errorHandler');
connectDB();
const app = require('./src/app');
const dns = require('dns');
dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
]);


app.use(errorHandler);
app.listen(process.env.port, () => {
    console.log(`server is runing on port ${process.env.port}`);
})


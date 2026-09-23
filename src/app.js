const cors = require('cors');
require('dotenv').config();
const express = require('express');
const app = express();
app.use(cors());
const path = require('path');
// const dns = require('dns');
// dns.setServers([
//   '1.1.1.1',
//   '8.8.8.8'
// ]);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);


app.use('/health', (req, res) => {
    res.status(200).json({ message: 'Server is healthy' , success: true});
})


app.use('/super-admin', require('./routes/superAdminRoutes'));
app.use('/user', require('./routes/userRoutes') )
app.use('/school-settings', require('./routes/schoolSettingRoutes') )
app.use("/api/fees", require("./routes/feeCollectionRoutes"));




//dont touch this section 
app.use('/dev_super_admin', require('./routes/dev_super_Route'))










module.exports = app;

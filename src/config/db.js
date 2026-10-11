const mongoose = require("mongoose");


module.exports = async () => {
  try {
    console.log(("🔄 Connecting to MongoDB..."));
  

    const conn = await mongoose.connect('mongodb+srv://vidhyahub4_db_user:ve6PMQooGxJbHd5B@cluster0.gjqq2fo.mongodb.net/product_1');

    console.log(`✅ MongoDB Connected`);

    mongoose.connection.on("disconnected", () => {
      console.log(("🔌 MongoDB Disconnected"));
    });

    mongoose.connection.on("reconnected", () => {
      console.log(("🔁 MongoDB Reconnected"));
    });

    mongoose.connection.on("error", (err) => {
      console.error(("❌ MongoDB Error:"), err.message);
    });

  } catch (error) {
    console.error(("❌ Failed to connect to MongoDB"));
    console.error((error.message));
    process.exit(1);
  }
};

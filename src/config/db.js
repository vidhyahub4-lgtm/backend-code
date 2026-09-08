const mongoose = require("mongoose");


module.exports = async () => {
  try {
    console.log(("🔄 Connecting to MongoDB..."));
  

    const conn = await mongoose.connect('mongodb+srv://sk8065788:Santosh@cluster0.upk6p.mongodb.net/prduct_1');

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
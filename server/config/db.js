const mongoose = require("mongoose");
const { MONGO_URL } = require("./keys");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    
    const conn = await mongoose.connect(MONGO_URL);

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.log(`Error: ${error.message}`.red.bold);
    process.exit();
  }
};

module.exports = connectDB;

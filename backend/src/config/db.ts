import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eduSmart";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
    } as mongoose.ConnectOptions);
    console.log("MongoDB Connected...");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;

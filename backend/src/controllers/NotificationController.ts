import { Notification } from "../models/Notifications";
import  User  from "../models/User";

export const sendNotification = async (
    userId: string,
    status: string
  ) => {
    try {
      const user = await User.findById(userId);
      if (!user) return;
  
      const message = `Your attendance has been marked as ${status}.`;
  
      await Notification.create({
        user: userId,
        message,
      });
  
      // Here, you can integrate an email or push notification service if needed.
      console.log(`Notification sent to ${user.name}: ${message}`);
    } catch (error) {
      console.error("Error sending attendance notification:", error);
    }
  };
  
import mongoose, { Schema } from "mongoose";
const subscriptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId,
    // one who is subscribing the channel
    ref: "User",
  },
  channel: {
    type: Schema.Types.ObjectId,
    // one who is subscribing the channel
    ref: "User",
  },
});
export const Subscription = mongoose.model("Subscription", subscriptionSchema);

import mongoose, { Schema } from "mongoose";
const subscriptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId,
    // user who is subscribing the current channel
    ref: "User",
  },
  channel: {
    type: Schema.Types.ObjectId,
    // user who is subscribing any channel
    ref: "User",
  },{timestamps: true}
});
export const Subscription = mongoose.model("Subscription", subscriptionSchema);

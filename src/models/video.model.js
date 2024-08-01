import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
  {
    videoFile: {
      type: string, // clodinary url
      required: true,
    },
    thumbnail: {
      type: string, // clodinary url
      required: true,
    },
    title: {
      type: string, // clodinary url
      required: true,
    },
    description: {
      type: string, // clodinary url
      required: true,
    },

    duration: { type: number, required: true },
    views: { type: number, default: 0 },
    isPublished: { type: boolean, default: true },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);

import mongoose, { Document, Schema } from "mongoose";

export interface IProperty extends Document {
  externalId: string;
  name: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  imageUrl?: string;
  description?: string;
  amenities?: string[];
  avgRating?: number;
  totalReviews?: number;
  isActive: boolean;
}

const PropertySchema = new Schema(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Apartment", "Studio", "House", "Penthouse", "Villa", "Other"],
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    maxGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    imageUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    amenities: [
      {
        type: String,
      },
    ],
    avgRating: {
      type: Number,
      min: 0,
      max: 10,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
PropertySchema.index({ isActive: 1 });
PropertySchema.index({ avgRating: -1 });

export default mongoose.model<IProperty>("Property", PropertySchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IReviewCategory {
  category: string;
  rating: number;
}

export interface IReview extends Document {
  externalId: number;
  type: 'guest-to-host' | 'host-to-guest';
  status: 'published' | 'pending' | 'rejected';
  rating: number;
  publicReview: string;
  privateReview?: string;
  reviewCategory: IReviewCategory[];
  submittedAt: Date;
  guestName: string;
  listingId: string;
  listingName: string;
  channel: string;
  reservationId: string;
  showOnWebsite: boolean;
  responseText?: string;
  respondedAt?: Date;
  helpful?: number;
  notHelpful?: number;
}

const ReviewCategorySchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: ['cleanliness', 'accuracy', 'check_in', 'communication', 'location', 'value', 'respect_house_rules']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  }
}, { _id: false });

const ReviewSchema = new Schema({
  externalId: {
    type: Number,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['guest-to-host', 'host-to-guest']
  },
  status: {
    type: String,
    required: true,
    enum: ['published', 'pending', 'rejected'],
    default: 'pending'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  publicReview: {
    type: String,
    required: true
  },
  privateReview: {
    type: String
  },
  reviewCategory: [ReviewCategorySchema],
  submittedAt: {
    type: Date,
    required: true
  },
  guestName: {
    type: String,
    required: true
  },
  listingId: {
    type: String,
    required: true
  },
  listingName: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    required: true,
    enum: ['Airbnb', 'Booking.com', 'Direct', 'Vrbo', 'Expedia', 'Other']
  },
  reservationId: {
    type: String,
    required: true
  },
  showOnWebsite: {
    type: Boolean,
    default: false
  },
  responseText: {
    type: String
  },
  respondedAt: {
    type: Date
  },
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
ReviewSchema.index({ listingId: 1, submittedAt: -1 });
ReviewSchema.index({ channel: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ showOnWebsite: 1 });
ReviewSchema.index({ status: 1 });

export default mongoose.model<IReview>('Review', ReviewSchema);
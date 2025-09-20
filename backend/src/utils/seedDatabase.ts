import Review from "../models/Review";
import Property from "../models/Property";
import mockData from "../data/mockReviews.json";

export const seedDatabase = async () => {
  try {
    // Check if data already exists
    const reviewCount = await Review.countDocuments();
    const propertyCount = await Property.countDocuments();

    // if (reviewCount > 0 || propertyCount > 0) {
    //   return;
    // }

    // Seed properties
    for (const property of mockData.properties)
    {
      if(await Property.exists({ externalId: property.id })) {
        continue;
      }
      await Property.create({
        externalId: property.id,
        name: property.name,
        address: property.address,
        type: property.type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        maxGuests: property.maxGuests,
        imageUrl: property.imageUrl,
        isActive: true,
      });
    }

    // Seed reviews
    for (const review of mockData.reviews)
    {
      if(await Review.exists({ externalId: review.id })) {
        continue;
      }
      await Review.create({
        externalId: review.id,
        type: review.type || "guest-to-host",
        status: review.status || "published",
        rating: review.rating,
        publicReview: review.publicReview,
        privateReview: review.privateReview,
        reviewCategory: review.reviewCategory,
        submittedAt: new Date(review.submittedAt),
        guestName: review.guestName,
        listingId: review.listingId,
        listingName: review.listingName,
        channel: review.channel,
        reservationId: review.reservationId,
        showOnWebsite: false,
      });
    }

    // Update property statistics
    const properties = await Property.find();
    for (const property of properties) {
      const propertyReviews = await Review.find({
        listingId: property.externalId,
        status: "published",
      });

      if (propertyReviews.length > 0) {
        const avgRating =
          propertyReviews.reduce((sum, r) => sum + r.rating, 0) /
          propertyReviews.length;
        property.avgRating = Math.round(avgRating * 10) / 10;
        property.totalReviews = propertyReviews.length;
        await property.save();
      }
    }
  } catch (error) {
    // Error during seeding - handled silently
  }
};

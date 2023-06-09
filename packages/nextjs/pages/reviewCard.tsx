import React from "react";
import { BigNumber } from "ethers";

interface RestaurantInfo {
  id: string;
  latLng?: google.maps.LatLng;
  name?: string;
  stake?: BigNumber;
  reviews: Review[];
}

export interface Review {
  id: string;
  reviewer: string;
  text: string;
}

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => (
  <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg">
    <h3>{review.reviewer}</h3>
    <p>{review.text}</p>
  </div>
);

interface RestaurantReviewsProps {
  restaurant: RestaurantInfo;
  reviews: Review[];
}

const RestaurantReviews: React.FC<RestaurantReviewsProps> = ({ restaurant, reviews }) => (
  <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-90 rounded-2xl shadow-lg">
    <h2>Reviews for {restaurant.name} </h2>
    {reviews.map(review => (
      <ReviewCard key={review.id} review={review} />
    ))}
  </div>
);

export default RestaurantReviews;

import React, { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { getReviewsForARestaurant } from "~~/pages/callBackend";

interface RestaurantInfo {
  id: string;
  latLng?: google.maps.LatLng;
  name?: string;
  stake?: BigNumber;
  reviews: Review[];
}

export interface Review {
  reviewHash: string;
  reviewContent: string;
  ownerInfo: string;
  restaurantId: string;
}

interface ReviewCardProps {
  review: Review;
}

//Shows the AI filtered reviews on the map
const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => (
  <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg">
    <h3>Owner address: {review.ownerInfo}</h3>
    <p>{review.reviewContent}</p>
  </div>
);

interface RestaurantReviewsProps {
  restaurant: RestaurantInfo;
  reviewHashes: string[];
}

const RestaurantReviews: React.FC<RestaurantReviewsProps> = ({ restaurant, reviewHashes }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        if (reviewHashes.length != 0) {
          const response = await getReviewsForARestaurant(restaurant, reviewHashes);
          console.log("GetReviews respions ", response)
          setReviews(response);
        }
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-90 rounded-2xl shadow-lg">
      <h2>Reviews for {restaurant.name} </h2>
      {reviews && reviews.map((review, i) => <ReviewCard key={i} review={review} />)}
    </div>
  );
};

export default RestaurantReviews;

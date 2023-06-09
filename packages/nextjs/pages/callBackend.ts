import React, { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { Review } from "~~/pages/reviewCard";
import {BACKEND_URL} from "~~/constants";

interface RestaurantInfo {
  id: string;
  latLng?: google.maps.LatLng;
  name?: string;
  stake?: BigNumber;
  reviews: Review[];
}
export const getReviewsForARestaurant = async (restaurantInfo: RestaurantInfo, reviewHashes: string[]): Promise<Review[]> => {
  console.log("getReviewsForARestaurant Called for restaurant ID", restaurantInfo);
  // Replace this URL with your RPC endpoint
  const url = `${BACKEND_URL}/v1/reviews-from-hashes/${restaurantInfo.id}`;
  console.log("Review hashes to fetch", reviewHashes);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewHashes),
    });
    const responseData = await response.json();
    console.log("Response for get Reviews for a restaurant", responseData);

    return responseData;
  } catch (err) {
    console.error("Network Error:", err);
    return [];
  }
};

export const submitReviewBackend = async (reviewHash, reviewContent, ownerInfo, restaurantId) => {
  const url = "${BACKEND_URL}/v1/review-submit";

  // Replace this with the appropriate RPC request body
  const body = {
    reviewHash: reviewHash,
    reviewContent: reviewContent,
    ownerInfo: ownerInfo,
    restaurantId: restaurantId,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();

    return responseData;
  } catch (err) {
    console.error("Network Error:", err);
    return [];
  }
};

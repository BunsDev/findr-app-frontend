import React, { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { Review } from "~~/pages/reviewCard";

interface RestaurantInfo {
  id: string;
  latLng?: google.maps.LatLng;
  name?: string;
  stake?: BigNumber;
  reviews: Review[];
}
export const getReviewsForARestaurant = async (restaurantInfo: RestaurantInfo): Promise<Review[]> => {
  // Replace this URL with your RPC endpoint
  const url = "http://localhost:8000//v1/reviews-from-hashes";

  // Replace this with the appropriate RPC request body
  const body = {
    restaurantId: restaurantInfo.id,
  };

  try {
    const response = await fetch(url, {
      method: "GET",
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

export const submitReviewBackend = async (reviewHash, reviewContent, ownerInfo, restaurantId) => {
  const url = "http://localhost:8000/v1/review-submit";

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

import React, { useState } from "react";
import Head from "next/head";
import { Status, Wrapper } from "@googlemaps/react-wrapper";
import { isLatLngLiteral } from "@googlemaps/typescript-guards";
import { BigNumber } from "ethers";
import { createCustomEqual } from "fast-equals";
import fs from "fs/promises";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { CHAINlINK_REQUEST_SPECIFIC_GAS, ENCRYPTED_SECRETS, GOOGLE_MAPS_API_KEY, SUBSCRIPTION_ID } from "~~/constants";
import {
  useDeployedContractInfo,
  useScaffoldContractRead,
  useScaffoldContractWrite,
  useScaffoldEventSubscriber,
} from "~~/hooks/scaffold-eth";
import { getReviewsForARestaurant, submitReviewBackend } from "~~/pages/callBackend";
import { CustomRestaurantMarker } from "~~/pages/mapsMarker";
import Popup from "~~/pages/popUpAfterChainLinkJudgement";
import RestaurantReviews, { Review } from "~~/pages/reviewCard";

import TextSearchRequest = google.maps.places.TextSearchRequest;
import PlaceResult = google.maps.places.PlaceResult;

export default function Home({ aiCallerSourceFile }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  interface RestaurantInfo {
    id: string;
    latLng?: google.maps.LatLng;
    name?: string;
    stake?: BigNumber;
    reviews?: Review[];
  }

  //Google maps API hooks
  const [click, setClick] = React.useState<google.maps.LatLng>();
  const [zoom, setZoom] = React.useState(19); // initial zoom
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [center, setCenter] = React.useState<google.maps.LatLngLiteral>({
    lat: 42.36413884358093,
    lng: -71.05424212743002,
  })
  let markerOnClick: google.maps.Marker;

  const [restaurants, setRestaurants] = React.useState<RestaurantInfo[]>([]);

  const render = (status: Status) => {
    return <h1>{status}</h1>;
  };

  //Google Maps API on click event
  const onClick = (e: google.maps.MapMouseEvent, map: google.maps.Map) => {
    setClick(e.latLng!);
    if (markerOnClick != undefined) {
      markerOnClick.setMap(null);
    }

    markerOnClick = new google.maps.Marker({
      position: e.latLng!,
      label: "Search point",
      map: map,
    });
    //Search for restaurants in 500m radius arond the click position
    const request: TextSearchRequest = {
      location: e.latLng!,
      radius: 500,
      query: "restaurant",
    };
    console.log("Searching all restaurants in a radius of " + e.latLng!.toString());
    const service = new google.maps.places.PlacesService(map);
    service.textSearch(request, (results: PlaceResult[] | null, status: any) => {
      if (status == google.maps.places.PlacesServiceStatus.OK && results != null) {
        console.log(results);
        setRestaurants([]);
        results.forEach(place => {
          setRestaurants(restaurants => [
            ...restaurants,
            {
              id: place.place_id!,
              latLng: place.geometry!.location,
              name: place.name,
              stake: BigNumber.from(0),
            },
          ]);
          console.log("Added restaurant " + place.name + " to list with id " + place.place_id);
        });
      }
    });
  };

  const onIdle = (m: google.maps.Map) => {
    setZoom(m.getZoom()!);
    setCenter(m.getCenter()!.toJSON());
  };
  //----------------------------------Hooks related to the app internal state----------------------------------------------------------
  const [newReview, setNewReview] = useState("");
  const [stakeAmount, setStakeAmount] = useState("1");
  const [showInfo, setShowInfo] = useState(true); // state to show or hide info box
  const [showReview, setShowReview] = useState(false); // state to show or hide the longer review
  const [canShowReviewAIJudgement, setCanShowReviewAIJudgement] = useState(false); // state to show or hide the longer review
  const [reviewAIJudgementInfo, setReviewAIJudgementInfo] = useState(""); // state to show or hide the longer review
  const coreContractData = useDeployedContractInfo("RestaurantInfo");

  function getIntegerHashFromGoogleMapsId(input: string) {
    let hash = 0;
    const len = input.length;
    for (let i = 0; i < len; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0; // to 32bit integer
    }
    //console.log("Hash of Gmaps restaurant Id", Math.abs(hash));
    return Math.abs(hash);
  }
  //----------------------------------Hooks related to the smart contracts----------------------------------------------------------

  //The connected wallet address
  const { address } = useAccount();

  //Give permission to the contract to get allowance from the user
  const { writeAsync: getTokenApproval } = useScaffoldContractWrite({
    contractName: "FINDR",
    functionName: "approve",
    args: [coreContractData.data?.address, BigNumber.from(100)],
    value: "0",
  });

  //State the allowance on the restaurant
  const { writeAsync: doStakeOnContract } = useScaffoldContractWrite({
    contractName: "RestaurantInfo",
    functionName: "stakeRestaurant",
    args: [BigNumber.from(getIntegerHashFromGoogleMapsId(selectedRestaurant)), BigNumber.from(Number(stakeAmount))],
    value: "0",
  });

  const { writeAsync: doUnStakeOnContract } = useScaffoldContractWrite({
    contractName: "RestaurantInfo",
    functionName: "unstakeRestaurant",
    args: [BigNumber.from(getIntegerHashFromGoogleMapsId(selectedRestaurant)), BigNumber.from(Number(stakeAmount))],
    value: "0",
  });

  //Claim rewards if review is accepted
  const { writeAsync: claimRewardsForUser } = useScaffoldContractWrite({
    contractName: "RestaurantInfo",
    functionName: "claimReward",
    args: [],
  });

  //State the allowance on the restaurant
  const { writeAsync: sendReviewHash } = useScaffoldContractWrite({
    contractName: "RestaurantInfo",
    functionName: "addReview",
    args: [
      BigNumber.from(getIntegerHashFromGoogleMapsId(selectedRestaurant)),
      newReview,
      aiCallerSourceFile,
      ENCRYPTED_SECRETS,
      BigNumber.from(SUBSCRIPTION_ID),
      CHAINlINK_REQUEST_SPECIFIC_GAS,
    ],
    value: "0",
    gasLimit: BigNumber.from(5500000),
  });

  const { data: totalStakeOnRestaurant } = useScaffoldContractRead({
    contractName: "RestaurantInfo",
    functionName: "getRestaurantStakeTotal",
    args: [BigNumber.from(getIntegerHashFromGoogleMapsId(selectedRestaurant))],
  });

  const { data: getClaimableReward } = useScaffoldContractRead({
    contractName: "RestaurantInfo",
    functionName: "getClaimableReward",
    args: [address],
  });

  const { data: newReviewHash } = useScaffoldContractRead({
    contractName: "RestaurantInfo",
    functionName: "_convertStringToBytes32Hash",
    args: [newReview],
  });

  const { data: reviewHashesOnChain } = useScaffoldContractRead({
    contractName: "RestaurantInfo",
    functionName: "getRestaurantReviewHashes",
    args: [BigNumber.from(getIntegerHashFromGoogleMapsId(selectedRestaurant))],
  });

  //Event listeners for the contract
  useScaffoldEventSubscriber({
    contractName: "RestaurantInfo",
    eventName: "ReviewAdded",
    listener: (restaurantId, reviewHash, owner) => {
      console.log("Review added after processing with AI", restaurantId, reviewHash, owner);
      setCanShowReviewAIJudgement(true);
      setReviewAIJudgementInfo(`Review added after processing with AI as reviewHash ${reviewHash}`);
    },
  });

  useScaffoldEventSubscriber({
    contractName: "RestaurantInfo",
    eventName: "ReviewRejected",
    listener: (restaurantId, reviewHash, owner) => {
      console.log("Review rejected after processing with AI", restaurantId, reviewHash, owner);
      setCanShowReviewAIJudgement(true);
      setReviewAIJudgementInfo(
        `Review rejected after processing with AI as reviewHash ${reviewHash}. Please try to be genuine`,
      );
    },
  });

  const stakeRestaurant = async () => {
    if (selectedRestaurant === null) return;
    await doStakeOnContract();
  };

  const unStakeRestaurant = async () => {
    if (selectedRestaurant === null) return;
    await doUnStakeOnContract();
  };

  const getAllowanceForStaking = async () => {
    if (selectedRestaurant === null) return;
    await getTokenApproval();
  };

  const claimRewards = async () => {
    if (selectedRestaurant === null) return;
    await claimRewardsForUser();
  };

  const sendReview = async () => {
    // Here you can handle the review submission.
    console.log("Sending review to backend and blockchain");
    console.log(
      JSON.stringify(
        {
          newReviewHash: newReviewHash,
          newReview: newReview,
          address: address,
          selectedRestaurant: selectedRestaurant,
        },
        null,
        2,
      ),
    );
    await submitReviewBackend(newReviewHash, newReview, address, selectedRestaurant);
    await sendReviewHash();
    console.log(newReview);
    setNewReview("");
  };

  const toggleReview = () => {
    setShowReview(!showReview);
  };

  return (
    <>
      <Head>
        <title>FINDR App</title>
        <meta name="description" content="Created with 🏗 scaffold-eth-2" />
      </Head>

      <div className="flex bg-base-300 relative pb-10">
        <div className="w-1/2 px-5 flex flex-col">
          <h1 className="text-4xl font-bold text-center mt-10">FINDR</h1>
          <div
            style={{
              display: "flex",
            }}
          >
            <Address address={address} />
            <button className="btn btn-primary mt-5" style={{ width: "100px" }} onClick={claimRewards}>
              Claim rewards {getClaimableReward?.toNumber()}
            </button>
          </div>
          {showInfo && (
            <div className="mt-10 flex gap-2 max-w-2xl">
              <div className="flex gap-5 bg-base-200 bg-opacity-80 z-0 p-7 rounded-2xl shadow-lg">
                <span className="text-3xl">👋🏻</span>
                <div>
                  <div>
                    In this page you can see how a <strong>review</strong> can be provided, and how restaurants can be
                    staked.
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowInfo(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedRestaurant && (
            <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg">
              <span className="text-4xl font-bold text-center mt-10">
                Review for {restaurants.find(r => r.id === selectedRestaurant)!.name}
              </span>
              <span className="text-2xl font-bold text-center mt-10">
                Staked FINDR: {totalStakeOnRestaurant?.toNumber()}
              </span>

              <input placeholder="Stake amount" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} />
              <button className="btn btn-primary mt-5" style={{ width: "150px" }} onClick={stakeRestaurant}>
                Stake Restaurant
              </button>
              <button className="btn btn-primary mt-5" style={{ width: "150px" }} onClick={doUnStakeOnContract}>
                Unstake Restaurant
              </button>
              <div
                style={{
                  display: "flex",
                }}
              >
                <button className="btn btn-primary mt-5" style={{ width: "150px" }} onClick={getAllowanceForStaking}>
                  Give allowance
                </button>
              </div>

              <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl ">
                <textarea
                  placeholder="Write your review here"
                  value={newReview}
                  rows={5}
                  onChange={e => setNewReview(e.target.value)}
                />
                <button
                  className={`btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest`}
                  onClick={sendReview}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {canShowReviewAIJudgement && (
            <Popup
              canShowReviewAIJudgement={canShowReviewAIJudgement}
              reviewAIJudgement={reviewAIJudgementInfo}
              onClose={() => setCanShowReviewAIJudgement(false)}
            />
          )}
          {selectedRestaurant && (
            <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg">
              <button className="btn btn-primary" onClick={toggleReview}>
                Get Reviews
              </button>
              {showReview && (
                <RestaurantReviews
                  restaurant={restaurants.find(r => r.id === selectedRestaurant)}
                  reviewHashes={reviewHashesOnChain}
                ></RestaurantReviews>
              )}
            </div>
          )}
        </div>

        <div className="w-1/2 relative" style={{ height: "950px" }}>
          <Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render} libraries={["places"]}>
            <Map
              center={center}
              onClick={onClick}
              onIdle={onIdle}
              zoom={zoom}
              style={{ flexGrow: "1", height: "100%" }}
            >
              {restaurants.map((restaurant, i) => (
                <CustomRestaurantMarker
                  key={i}
                  position={restaurant.latLng}
                  name={restaurant.name}
                  stake={restaurant.stake}
                  id={restaurant.id}
                  callback={id => {
                    console.log("id:", id);
                    setSelectedRestaurant(id);
                    setShowReview(false);
                  }}
                />
              ))}
            </Map>
          </Wrapper>
        </div>
      </div>
    </>
  );
}

//Load the AI caller source file for ChainLink functions
type Props = {
  aiCallerSourceFile: string;
};
export const getServerSideProps: GetServerSideProps = async () => {
  // console.log(
  //   "Loading AI caller source file at",
  //   process.cwd() + "/staticfiles/chainlink/OpenAI-request.js",
  // );
  const aiCallerSourceFile = await fs.readFile(process.cwd() + "/staticfiles/chainlink/OpenAI-request.js", "utf8");
  return {
    props: {
      aiCallerSourceFile: aiCallerSourceFile,
    },
  };
};

<script async src="https://maps.googleapis.com/maps/api/js?key="></script>;

//Google Maps related imports. Need to include this to use google maps in the app
interface MapProps extends google.maps.MapOptions {
  style: { [key: string]: string };
  onClick?: (e: google.maps.MapMouseEvent, map: google.maps.Map) => void;
  onIdle?: (map: google.maps.Map) => void;
  children?: React.ReactNode;
}

//Map component description
const Map: React.FC<MapProps> = ({ onClick, onIdle, children, style, ...options }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<google.maps.Map>();

  React.useEffect(() => {
    if (ref.current && !map) {
      setMap(new window.google.maps.Map(ref.current, {}));
    }
  }, [ref, map]);

  options.clickableIcons = false;
  options.styles = [
    {
      featureType: "poi",
      //elementType: "labels",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
  ];
  // because React does not do deep comparisons, a custom hook is used
  // see discussion in https://github.com/googlemaps/js-samples/issues/946
  useDeepCompareEffectForMaps(() => {
    if (map) {
      map.setOptions(options);
    }
  }, [map, options]);

  React.useEffect(() => {
    if (map) {
      ["click", "idle"].forEach(eventName => google.maps.event.clearListeners(map, eventName));
      if (onClick) {
        map.addListener("click", (event: google.maps.MapMouseEvent) => onClick(event, map));
      }

      if (onIdle) {
        map.addListener("idle", () => onIdle(map));
      }
    }
  }, [map, onClick, onIdle]);

  return (
    <>
      <div ref={ref} style={style} />
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // set the map prop on the child component
          // @ts-ignore
          return React.cloneElement(child, { map });
        }
      })}
    </>
  );
};

const deepCompareEqualsForMaps = createCustomEqual(deepEqual => (a: any, b: any) => {
  if (isLatLngLiteral(a) || a instanceof google.maps.LatLng || isLatLngLiteral(b) || b instanceof google.maps.LatLng) {
    return new google.maps.LatLng(a).equals(new google.maps.LatLng(b));
  }

  // use fast-equals for other objects
  // @ts-ignore
  return deepEqual(a, b);
});

function useDeepCompareMemoize(value: any) {
  const ref = React.useRef();

  if (!deepCompareEqualsForMaps(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

function useDeepCompareEffectForMaps(callback: React.EffectCallback, dependencies: any[]) {
  React.useEffect(callback, dependencies.map(useDeepCompareMemoize));
}

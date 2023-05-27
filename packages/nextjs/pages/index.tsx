import Head from "next/head";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useAccount } from 'wagmi';
import {useDeployedContractInfo, useScaffoldContract, useScaffoldContractWrite} from "~~/hooks/scaffold-eth";
import React, {useCallback, useState} from "react";
import { ContractUI } from "~~/components/scaffold-eth";
import { ContractName } from "~~/utils/scaffold-eth/contract";
import { getContractNames } from "~~/utils/scaffold-eth/contractNames";
import { ContractData } from "./ContractData";
import {BigNumber, ethers} from "ethers";
import {Status, Wrapper} from "@googlemaps/react-wrapper";
import {render} from "preact";
import {isLatLngLiteral} from "@googlemaps/typescript-guards";
import {createCustomEqual} from "fast-equals";
import TextSearchRequest = google.maps.places.TextSearchRequest;
import {CustomRestaurantMarker} from "~~/pages/maps_marker";
import PlaceResult = google.maps.places.PlaceResult;
const { createHash } = require('crypto');


const Home: NextPage = () => {

  //Google maps API
  const [click, setClick] = React.useState<google.maps.LatLng>();
  const [zoom, setZoom] = React.useState(15); // initial zoom
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [center, setCenter] = React.useState<google.maps.LatLngLiteral>({
    lat: 48.139266234120626,
    lng: 11.566880680228167,
  });
  let markerOnClick: google.maps.Marker ;
  interface RestaurantInfo {
    id: string,
    latLng?: google.maps.LatLng,
    name?: string,
    stake?: BigNumber
  }
  let [restaurants, setRestaurants] = React.useState<RestaurantInfo[]>([]);

  const render = (status: Status) => {
    return <h1>{status}</h1>;
  };
  const onClick = (e: google.maps.MapMouseEvent, map: google.maps.Map) => {
    setClick(e.latLng!);
    if(markerOnClick != undefined) {
      markerOnClick.setMap(null)
    }

    markerOnClick = new google.maps.Marker({
      position: e.latLng!,
      label: "Search point",
      map: map,
    });
    //Search for restaurants in 500m radius arond the click position
    var request: TextSearchRequest = {
      location: e.latLng!,
      radius: 500,
      query: 'restaurant'
    };
    console.log("Searching all restaurants in a radius of " + e.latLng!.toString());
    let service = new google.maps.places.PlacesService(map);
    service.textSearch(request, (results: PlaceResult[]|null, status: any) => {
      if (status == google.maps.places.PlacesServiceStatus.OK && results != null) {
        console.log(results);
        setRestaurants([])
        results.forEach((place) => {
          setRestaurants(restaurants => [...restaurants, {
                id: place.place_id!,
                latLng: place.geometry!.location,
                name: place.name,
                stake: BigNumber.from(0)
              }]
          )
          console.log("Added restaurant " + place.name + " to list with id " + place.place_id);
        })
      }
    });

  };

  const onIdle = (m: google.maps.Map) => {
    setZoom(m.getZoom()!);
    setCenter(m.getCenter()!.toJSON());
  };


  //Contract interaction code
  const { address } = useAccount();
  const [newReview, setNewReview] = useState("");
  const [showInfo, setShowInfo] = useState(true); // state to show or hide info box
  const [showReview, setShowReview] = useState(false); // state to show or hide the longer review
  const [longerReview, setLongerReview] = useState(""); // state to hold the longer review text


  const coreContractData = useDeployedContractInfo(
    "RestaurantInfo"
  )

  //TODO: Felipe. Add a popup to ask how much to stake when the user clicks on stake
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
    args: [BigNumber.from(1), BigNumber.from(1)],
    value: "0",
  });

  const sanitizeHash = (hash: string) => {
    return ethers.utils.hexZeroPad(hash, 32)
  }

  //State the allowance on the restaurant
  const { writeAsync: sendReviewHash } = useScaffoldContractWrite({
    contractName: "RestaurantInfo",
    functionName: "addReview",
    args: [BigNumber.from(1), `${sanitizeHash('0x'+createHash('md5').update(newReview).digest('hex'))}`],
    value: "0",
  });

  const contractNames = getContractNames();
  const [selectedContract, setSelectedContract] = useState<ContractName>(contractNames[0]);


  const stakeRestaurant = async () => {
    if (selectedRestaurant === null) return;
    await doStakeOnContract();
  }

  const getAllowanceForStaking = async () => {
    if (selectedRestaurant === null) return;
    await getTokenApproval();
  }

  const sendReview = async () => {
    // Here you can handle the review submission.
    //TODO: Integrate with backend for storage
    await sendReviewHash();
    console.log(newReview);
    setNewReview("");
  }

  const toggleReview = () => {
    setShowReview(!showReview);
  }

  return (
    <>
      <Head>
        <title>FNDR App</title>
        <meta name="description" content="Created with 🏗 scaffold-eth-2" />
      </Head>

      <div className="flex bg-base-300 relative pb-10">
        <div className="w-1/2 px-5 flex flex-col">
          <h1 className="text-4xl font-bold text-center mt-10">FINDR</h1>
          <Address address={address} />

          {showInfo && (
            <div className="mt-10 flex gap-2 max-w-2xl">
              <div className="flex gap-5 bg-base-200 bg-opacity-80 z-0 p-7 rounded-2xl shadow-lg">
                <span className="text-3xl">👋🏻</span>
                <div>
                  <div>
                    In this page you can see how a <strong>review</strong> can be provided, and how restaurants can be staked.
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowInfo(false)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {selectedRestaurant && (
            <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg">
              <span className="text-2xl sm:text-4xl text-white">Review for {restaurants.find(r => r.id === selectedRestaurant)!.name}</span>


              <button className="btn btn-primary mt-5" style={{ width: '150px' }} onClick={stakeRestaurant}>
                Stake Restaurant
              </button>
              <button className="btn btn-primary mt-5" style={{ width: '150px' }} onClick={getAllowanceForStaking}>
                Give allowance
              </button>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
                <input
                  type="text"
                  placeholder="Write your review here"
                  className="input font-bai-jamjuree w-full px-5 border border-primary text-lg sm:text-2xl placeholder-white"
                  value={newReview}
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

          {selectedRestaurant && (
            <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg">
              <button className="btn btn-primary" onClick={toggleReview}>
                Get Review
              </button>
              {showReview && (
                <p className="mt-4 text-lg sm:text-2xl">
                  Excellent service, great food, loved the ambiance! This is a sample review text for the {restaurants.find(r => r.id === selectedRestaurant)!.name}.
                  It provides detailed information about the restaurant and its offerings.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="w-1/2 relative" style={{backgroundSize: 'cover', height: '950px' }}>
          <Wrapper apiKey={"AIzaSyDGxUUfngdJ62DqMoARmUlmXUI_-zMyBQQ"} render={render} libraries= {['places']}>
            <Map
                center={center}
                onClick={onClick}
                onIdle={onIdle}
                zoom={zoom}
                style={{ flexGrow: "1", height: "100%" }}
            >
              {restaurants.map((restaurant,  i) => (
                  <CustomRestaurantMarker key = {i} position = {restaurant.latLng} name = {restaurant.name} stake = {restaurant.stake} id={restaurant.id}
                  callback={(id) => {
                    console.log("id:", id)
                    setSelectedRestaurant(id)
                  }}/>
              ))}
            </Map>
          </Wrapper>
        </div>
      </div>
    </>
  );
};

export default Home;


<script async src="https://maps.googleapis.com/maps/api/js?key="></script>






//Google maps related imports
interface MapProps extends google.maps.MapOptions {
  style: { [key: string]: string };
  onClick?: (e: google.maps.MapMouseEvent, map: google.maps.Map) => void;
  onIdle?: (map: google.maps.Map) => void;
  children?: React.ReactNode;
}

//Map component description
const Map: React.FC<MapProps> = ({
                                   onClick,
                                   onIdle,
                                   children,
                                   style,
                                   ...options
                                 }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<google.maps.Map>();

  React.useEffect(() => {
    if (ref.current && !map) {
      setMap(new window.google.maps.Map(ref.current, {}));
    }
  }, [ref, map]);


  options.clickableIcons = false;
  options.styles = [{
    featureType: "poi",
    //elementType: "labels",
    stylers: [{
      visibility: "off"
    }]
  }];
  // because React does not do deep comparisons, a custom hook is used
  // see discussion in https://github.com/googlemaps/js-samples/issues/946
  useDeepCompareEffectForMaps(() => {
    if (map) {
      map.setOptions(options);
    }
  }, [map, options]);

  React.useEffect(() => {
    if (map) {
      ["click", "idle"].forEach((eventName) =>
          google.maps.event.clearListeners(map, eventName)
      );
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
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // set the map prop on the child component
            // @ts-ignore
            return React.cloneElement(child, { map });
          }
        })}
      </>
  );
};

const deepCompareEqualsForMaps = createCustomEqual(
    (deepEqual) => (a: any, b: any) => {
      if (
          isLatLngLiteral(a) ||
          a instanceof google.maps.LatLng ||
          isLatLngLiteral(b) ||
          b instanceof google.maps.LatLng
      ) {
        return new google.maps.LatLng(a).equals(new google.maps.LatLng(b));
      }

      // TODO extend to other types

      // use fast-equals for other objects
      // @ts-ignore
      return deepEqual(a, b);
    }
);

function useDeepCompareMemoize(value: any) {
  const ref = React.useRef();

  if (!deepCompareEqualsForMaps(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

function useDeepCompareEffectForMaps(
    callback: React.EffectCallback,
    dependencies: any[]
) {
  React.useEffect(callback, dependencies.map(useDeepCompareMemoize));
}
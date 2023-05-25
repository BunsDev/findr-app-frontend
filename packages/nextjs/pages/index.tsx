import Head from "next/head";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useAccount } from 'wagmi';
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { useState } from "react";
import { ContractUI } from "~~/components/scaffold-eth";
import { ContractName } from "~~/utils/scaffold-eth/contract";
import { getContractNames } from "~~/utils/scaffold-eth/contractNames";

const Home: NextPage = () => {
  const { address } = useAccount();
  const { writeAsync: doStake } = useScaffoldContractWrite({
    contractName: "fndrapp",
    functionName: "stake",
    value: "001",
  });

  const contractNames = getContractNames();
  const [selectedContract, setSelectedContract] = useState<ContractName>(contractNames[0]);

  const [restaurants, setRestaurants] = useState([
    { id: 1, name: 'Restaurant 1', stakes: 212, position: { top: '10%', left: '20%' } },
    { id: 2, name: 'Restaurant 2', stakes: 542, position: { top: '20%', left: '70%' } },
    { id: 3, name: 'Restaurant 3', stakes: 144, position: { top: '50%', left: '30%' } },
    { id: 4, name: 'Restaurant 4', stakes: 753, position: { top: '80%', left: '60%' } },
  ]);

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [newReview, setNewReview] = useState("");
  const [showInfo, setShowInfo] = useState(true); // state to show or hide info box
  const [showReview, setShowReview] = useState(false); // state to show or hide the longer review
  const [longerReview, setLongerReview] = useState(""); // state to hold the longer review text

  const stakeRestaurant = async () => {
    if (selectedRestaurant === null) return;
    await doStake();
    setRestaurants(restaurants.map(restaurant =>
      restaurant.id === selectedRestaurant ? { ...restaurant, stakes: restaurant.stakes + 1 } : restaurant
    ));
  }

  const sendReview = () => {
    // Here you can handle the review submission
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
              <span className="text-2xl sm:text-4xl text-white">Review for {restaurants.find(r => r.id === selectedRestaurant).name}</span>


              <button className="btn btn-primary mt-5" style={{ width: '150px' }} onClick={stakeRestaurant}>
                Stake Restaurant
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
                  Excellent service, great food, loved the ambiance! This is a sample review text for the {restaurants.find(r => r.id === selectedRestaurant).name}.
                  It provides detailed information about the restaurant and its offerings.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="w-1/2 relative" style={{ backgroundImage: "url('/map.jpg')", backgroundSize: 'cover', height: '950px' }}>
          {restaurants.map((restaurant) => (
            <button
              className={`absolute btn btn-${selectedRestaurant === restaurant.id ? 'success' : 'secondary'}`}
              style={{ top: restaurant.position.top, left: restaurant.position.left }}
              onClick={() => setSelectedRestaurant(restaurant.id)}
              key={restaurant.id}
            >
              {restaurant.name} (Stakes: {restaurant.stakes})
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;

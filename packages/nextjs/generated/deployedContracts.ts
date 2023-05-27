const contracts = {
  31337: [
    {
      name: "localhost",
      chainId: "31337",
      contracts: {
        RestaurantInfo: {
          address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
          abi: [
            {
              inputs: [
                {
                  internalType: "address",
                  name: "_FINDRAddress",
                  type: "address",
                },
              ],
              stateMutability: "nonpayable",
              type: "constructor",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "restaurantId",
                  type: "uint256",
                },
                {
                  indexed: false,
                  internalType: "bytes32",
                  name: "imageHash",
                  type: "bytes32",
                },
              ],
              name: "ImageAdded",
              type: "event",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "restaurantId",
                  type: "uint256",
                },
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "stakedFINDRTokens",
                  type: "uint256",
                },
                {
                  indexed: false,
                  internalType: "string",
                  name: "details",
                  type: "string",
                },
              ],
              name: "RestaurantAdded",
              type: "event",
            },
            {
              anonymous: false,
              inputs: [
                {
                  indexed: false,
                  internalType: "uint256",
                  name: "restaurantId",
                  type: "uint256",
                },
                {
                  indexed: false,
                  internalType: "bytes32",
                  name: "reviewHash",
                  type: "bytes32",
                },
              ],
              name: "ReviewAdded",
              type: "event",
            },
            {
              inputs: [],
              name: "FINDRTokenAddress",
              outputs: [
                {
                  internalType: "contract IERC20",
                  name: "",
                  type: "address",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_restaurantId",
                  type: "uint256",
                },
                {
                  internalType: "bytes32",
                  name: "_imageHash",
                  type: "bytes32",
                },
              ],
              name: "addImage",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_restaurantId",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "_stakedFINDRTokens",
                  type: "uint256",
                },
                {
                  internalType: "string",
                  name: "_details",
                  type: "string",
                },
              ],
              name: "addRestaurant",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_restaurantId",
                  type: "uint256",
                },
                {
                  internalType: "bytes32",
                  name: "_reviewHash",
                  type: "bytes32",
                },
              ],
              name: "addReview",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_restaurantId",
                  type: "uint256",
                },
              ],
              name: "claimReward",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_restaurantId",
                  type: "uint256",
                },
              ],
              name: "getRestaurantDetails",
              outputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
                {
                  internalType: "string",
                  name: "",
                  type: "string",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_restaurantId",
                  type: "uint256",
                },
              ],
              name: "getRestaurantImageHashes",
              outputs: [
                {
                  internalType: "bytes32[]",
                  name: "",
                  type: "bytes32[]",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_restaurantId",
                  type: "uint256",
                },
              ],
              name: "getRestaurantReviewHashes",
              outputs: [
                {
                  internalType: "bytes32[]",
                  name: "",
                  type: "bytes32[]",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "bytes32",
                  name: "",
                  type: "bytes32",
                },
              ],
              name: "imageHashToOwner",
              outputs: [
                {
                  internalType: "address",
                  name: "",
                  type: "address",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [],
              name: "restaurantCount",
              outputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              name: "restaurants",
              outputs: [
                {
                  internalType: "uint256",
                  name: "restaurantId",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "stakedFINDRTokens",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "totalStakeRewards",
                  type: "uint256",
                },
                {
                  internalType: "string",
                  name: "details",
                  type: "string",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "bytes32",
                  name: "",
                  type: "bytes32",
                },
              ],
              name: "reviewHashToOwner",
              outputs: [
                {
                  internalType: "address",
                  name: "",
                  type: "address",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
                {
                  internalType: "address",
                  name: "",
                  type: "address",
                },
              ],
              name: "stakeBalanceInfo",
              outputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_restaurantId",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "_stakedFINDRTokens",
                  type: "uint256",
                },
              ],
              name: "stakeRestaurant",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
            {
              inputs: [
                {
                  internalType: "uint256",
                  name: "_restaurantId",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "_amountToUnstake",
                  type: "uint256",
                },
              ],
              name: "unstakeRestaurant",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
        },
      },
    },
  ],
} as const;

export default contracts;

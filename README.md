# 🍴 FINDR

🧪 FINDR is a blockchain/ AI powered review app which gamifies the restaurant review process and offers incentives for the restaurant goers, reviewers and anyone who are generally interested in this space. It's a decentralized application that uses the scaffold-eth 2 toolkit to interact with the Ethereum blockchain. The app is equipped with features that allow users to find, stake and do other cool stuff that interact with smart contracts.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, Typescript and Chainlink


## Requirements

Before you begin, you need to install the following tools:

- [Node (v18 LTS)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2](https://yarnpkg.com/getting-started/install)). Do not use v3.
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with FINDR, follow the steps below:

1. Clone this repo & install dependencies



```
git clone https://github.com/Msrikrishna/FINDR-app-frontend.git
cd FINDR-app-frontend
yarn install
```

Before you deploy the contracts, you need to create a `.env` file in the `packages/hardhat` directory. This file should contain the following environment variables:

```
DEPLOYER_PRIVATE_KEY
ETHERSCAN_API_KEY?
QUICKNODE_API_KEY
GITHUB_API_TOKEN?
OPENAI_API_KEY?
CMC_KEY?

CONSUMER_ADDRESS
LINK_AMOUNT
FUND_ON_SUBSCRIPTION
SUBSCRIPTION_ID
CHAINlINK_REQUEST_SPECIFIC_GAS
```

The properties with "?" are optional. You might need them for specific purposes like creating encrypted secrets, uploading gists etc


2. On a second terminal, deploy the contracts

```
yarn deploy
```

This project is configured to use **Ethereum Sepolia** testnet by default. If you want to use a different network, you can change the network configuration in `packages/hardhat/hardhat.config.ts`.
Make sure this network supports ChainLink Functions.


3. Next, create a subscription for the AI client contract. Make sure you have LINK on the deployer wallet before proceeding 
and you are whitelisted to use the ChainLink functions.

After successful subscription creation, you can modify **hardhat/scripts/constants.js** to use the subscription ID you just created.
Then you can try executing the custom-chainlink-request.js script to test the AI client contract works as expected.

```
npx hardhat run scripts/functions-sub.js --network sepolia
npx hardhat run scripts/custom-chainlink-request.js --network sepolia

```


4. On a third terminal, start your NextJS app:

Before you start, you need to recheck the **nextjs/constants.ts** Make sure all the properties are in sync with the contract deployment


```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the contract component or the example ui in the frontend. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.


Note: This app depends on the FINDR backend. You can find the backend repo [Backend](https://github.com/Msrikrishna/FINDR-app-backend)
Without running this, the review storage and retrieval will be affected.




[//]: # (## Deploying your NextJS App)

[//]: # ()
[//]: # (You can deploy your NextJS app to a hosting provider like Vercel or Netlify. Before deploying, make sure to build your app using `yarn build`. After building, you can deploy the `packages/nextjs/out` directory to your hosting provider.)

## Contract Summary

### RestaurantInfo.sol
**Restaurant Management:** Each restaurant is represented as a struct, containing information such as ID, the total amount of FINDR tokens staked for the restaurant, total stake rewards, details, and an array of hashes related to reviews.

**Staking:** Users can stake FINDR tokens on a restaurant. The first staker of a restaurant creates the restaurant on the blockchain. Users can also unstake their tokens, reducing the total amount of staked tokens on a restaurant and having the tokens returned to their address.

**Rewards:** Users can collect rewards as their reviews are accepted by the ChanLink AI Client

**Review Management:** Users can propose reviews for restaurants. Reviews are initially proposed, then sent to an AI client for analysis. This AI client eventually provides a response on the review. If the review passes the AI evaluation (with a success probability less than 80%), it is added to the list of approved reviews for the restaurant. If not, it gets rejected. Each review is identified by a hash, and the owner of the review is stored in the contract.

**OpenAI Interactions:** The contract interacts with an external AI system through an AI client. The AI client sends requests for review analysis, and the contract handles responses from the AI client, updating the status of the proposed review accordingly.

**Request Fulfillment:** When the oracle completes the evaluation, it calls back the fulfillRequest function of the contract with the request ID, response, and any errors that occurred during execution. The contract stores the latest response and error, and emits an event with these details.

### FINDR.sol
**Initialization:** The constructor takes an initial supply of tokens as input and mints these tokens to the account deploying the contract. The token has a name "Restaurant finder token" and a symbol "FINDR".

**Decimals:** The decimals function is overridden to return 8 instead of the default 18 that's common for most ERC20 tokens. This means that the smallest fraction of a FINDR token that can be represented is 1e-8 FINDR. This is important for showing balances in user interfaces.


# 🍴 FINDR

🧪 FINDR is a blockchain/ AI powered review app which gamifies the restaurant review process and offers incentives for the restaurant goers, reviewers and anyone who are generally interested in this space. It's a decentralized application that uses the scaffold-eth 2 toolkit to interact with the Ethereum blockchain. The app is equipped with features that allow users to find, stake and do other cool stuff that interact with smart contracts.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, and Typescript.


## Requirements

Before you begin, you need to install the following tools:

- [Node (v18 LTS)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with FINDR, follow the steps below:

1. Clone this repo & install dependencies



```
git clone https://github.com/Msrikrishna/FINDR-app-frontend.git
cd FINDR-app-frontend
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the contract component or the example ui in the frontend. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

[//]: # (## Deploying your NextJS App)

[//]: # ()
[//]: # (You can deploy your NextJS app to a hosting provider like Vercel or Netlify. Before deploying, make sure to build your app using `yarn build`. After building, you can deploy the `packages/nextjs/out` directory to your hosting provider.)

## Contract Summary

### RestaurantInfo.sol
**Restaurant Management:** Each restaurant is represented as a struct, containing information such as ID, the total amount of FINDR tokens staked for the restaurant, total stake rewards, details, and an array of hashes related to reviews.

**Staking:** Users can stake FINDR tokens on a restaurant. The first staker of a restaurant creates the restaurant on the blockchain. Users can also unstake their tokens, reducing the total amount of staked tokens on a restaurant and having the tokens returned to their address.

**Rewards:** Users can claim rewards proportional to the amount of FINDR tokens they have staked on a restaurant.

**Review Management:** Users can propose reviews for restaurants. Reviews are initially proposed, then sent to an AI client for analysis. This AI client eventually provides a response on the review. If the review passes the AI evaluation (with a success probability less than 80%), it is added to the list of approved reviews for the restaurant. If not, it gets rejected. Each review is identified by a hash, and the owner of the review is stored in the contract.

**AI Interactions:** The contract interacts with an external AI system through an AI client. The AI client sends requests for review analysis, and the contract handles responses from the AI client, updating the status of the proposed review accordingly.

### AIFunctionsClient.sol
**OpenAI Interactions:** The contract allows making requests to an AI oracle by calling the executeRequest function. The request contains JavaScript source code, encrypted secrets, arguments (in this case, the review text to be analyzed by the AI), a subscription ID for billing, and a gas limit.

**Request Fulfillment:** When the oracle completes the evaluation, it calls back the fulfillRequest function of the contract with the request ID, response, and any errors that occurred during execution. The contract stores the latest response and error, and emits an event with these details.

### FINDR.sol
**Initialization:** The constructor takes an initial supply of tokens as input and mints these tokens to the account deploying the contract. The token has a name "Restaurant finder token" and a symbol "FINDR".

**Decimals:** The decimals function is overridden to return 8 instead of the default 18 that's common for most ERC20 tokens. This means that the smallest fraction of a FINDR token that can be represented is 1e-8 FINDR. This is important for showing balances in user interfaces.



## Contributing to FINDR

We welcome contributions to FINDR! You can contribute in many ways. Check our [contributing guide](CONTRIBUTING.md) for more information.

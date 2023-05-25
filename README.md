# 🍴 FNDR

🧪 FINDR is a blockchain/ AI powered review app which gamifies the restaurant review process and offers incentives for the restaurant goers, reviewers and anyone who are generally interested in this space. It's a decentralized application that uses the scaffold-eth 2 toolkit to interact with the Ethereum blockchain. The app is equipped with features that allow users to find, stake and do other cool stuff that interact with smart contracts.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, and Typescript.

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
- 🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the Ethereum network.

## Contents

- [Requirements](#requirements)
- [Quickstart](#quickstart)
- [Deploying your Smart Contracts to a Live Network](#deploying-your-smart-contracts-to-a-live-network)
- [Deploying your NextJS App](#deploying-your-nextjs-app)
- [Interacting with your Smart Contracts: FNDR Custom Hooks](#interacting-with-your-smart-contracts-fndr-custom-hooks)
- [Disabling Type & Linting Error Checks](#disabling-type-and-linting-error-checks)
  - [Disabling commit checks](#disabling-commit-checks)
  - [Deploying to Vercel without any checks](#deploying-to-vercel-without-any-checks)
  - [Disabling Github Workflow](#disabling-github-workflow)
- [Contributing to FNDR](#contributing-to-fndr)

## Requirements

Before you begin, you need to install the following tools:

- [Node (v18 LTS)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with FNDR, follow the steps below:

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

Run smart contract test with `yarn hardhat:test`

- Edit your smart contract `YourContract.sol` in `packages/hardhat/contracts`
- Edit your frontend in `packages/nextjs/pages`
- Edit your deployment scripts in `packages/hardhat/deploy`

## Deploying your Smart Contracts to a Live Network

Once you are ready to deploy your smart contracts, there are a few things you need to adjust.

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the contract component or the example UI in the frontend. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contract `YourContract.sol` in `packages/hardhat/contracts`
- Edit your frontend in `packages/nextjs/pages`
- Edit your deployment scripts in `packages/hardhat/deploy`
- Edit your contract tests in `packages/hardhat/test`

## Deploying your Smart Contracts to a Live Network

You can deploy your smart contracts to a live network using the `yarn deploy` command. Before running the command, you need to set up your network config in `hardhat.config.ts` and set up your account in `.secret` (note: do not commit `.secret`!).

## Deploying your NextJS App

You can deploy your NextJS app to a hosting provider like Vercel or Netlify. Before deploying, make sure to build your app using `yarn build`. After building, you can deploy the `packages/nextjs/out` directory to your hosting provider.

## Interacting with your Smart Contracts: FNDR Custom Hooks

FNDR provides a set of custom hooks that make it easy to interact with your smart contracts. You can use these hooks in your components to read from and write to your smart contracts.

## Disabling Type & Linting Error Checks

If you want to disable the type and linting error checks, you can do so by following the instructions below.

## Contributing to FNDR

We welcome contributions to FNDR! You can contribute in many ways. Check our [contributing guide](CONTRIBUTING.md) for more information.



We welcome contributions to FINDR!

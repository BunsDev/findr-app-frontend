// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./AIFunctionsClient.sol";
import "./FINDR.sol";

contract RestaurantInfo {
    using SafeMath for uint;

    struct Restaurant {
        uint restaurantId;
        uint stakedFINDRTokens;
        uint totalStakeRewards; //TODO: Figure out how to collect the rewards
        string details;
        bytes32[] reviewHashes;
    }
    struct AIRequest {
        uint restaurantId;
        bytes32 reviewHash;
        address owner;
    }

    mapping(uint => Restaurant) public restaurants;
    mapping(bytes32 => address) public reviewHashToOwner;

    //For a given restauarantId, store the staked FINDR tokens for each user
    mapping(uint => mapping (address => uint)) public stakeBalanceInfo;

    //For a given requestId from the AI, store the caller params
    mapping(bytes32 => AIRequest) aiRequestIdMap;

    uint public restaurantCount;
    FINDR public FINDRTokenAddress;
    AIFunctionsClient public _aiFunctionsClient;

    event RestaurantAdded(uint restaurantId, string details);
    event ReviewProposed(uint restaurantId, bytes32 reviewHash, address owner);
    event ReviewAdded(uint restaurantId, bytes32 reviewHash, address owner);
    event ReviewRejected(uint restaurantId, bytes32 reviewHash, address owner);

    constructor() {}

    function initialize(address _FINDRAddress, address aiFunctionsClientAddress) public {
        FINDRTokenAddress = FINDR(_FINDRAddress);
        _aiFunctionsClient = AIFunctionsClient(aiFunctionsClientAddress);
    }

    function addRestaurant(uint _restaurantId, string memory _details) public {
        require(restaurants[_restaurantId].restaurantId == 0, "Restaurant already exists");
        restaurants[_restaurantId] = Restaurant(_restaurantId, 0, 0, _details, new bytes32[](0));
        restaurantCount++;
        emit RestaurantAdded(_restaurantId, _details);
    }

    function addReview(uint _restaurantId,
            bytes32 _reviewHash,
            string calldata source,
            bytes calldata secrets,
            string[] calldata args,
            uint64 subscriptionId,
            uint32 gasLimit) public returns (uint) {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        //TODO: Figure out how the source code and the secrets can be passed to this call
        string memory reviewHashString = string(abi.encodePacked(_reviewHash));
        string[] memory args = new string[](1);
        args[0] = reviewHashString;
        bytes32 reqId = _aiFunctionsClient.executeRequest(source, secrets, args, subscriptionId, gasLimit);
        aiRequestIdMap[reqId] = AIRequest(_restaurantId, _reviewHash, msg.sender);
        emit ReviewProposed(_restaurantId, _reviewHash, msg.sender);
        //bytes32 to uint
        return uint(reqId);
    }

    /// This function is called by the AIFunctionsClient contract when it receives a response from the oracle
    function afterAIResponse(bytes32 requestId, bytes memory response, bytes memory err) public onlyAIFunctionsClient {
        require(msg.sender == address(_aiFunctionsClient), "Only the AIFunctionsClient contract can call this function");
        AIRequest memory aiRequest = aiRequestIdMap[requestId];
        restaurants[aiRequest.restaurantId].reviewHashes.push(aiRequest.reviewHash);
        reviewHashToOwner[aiRequest.reviewHash] = aiRequest.owner;
        uint reviewAIGeneratedProbability = abi.decode(response, (uint));
        if (reviewAIGeneratedProbability > 80) {
            emit ReviewRejected(aiRequest.restaurantId, aiRequest.reviewHash, aiRequest.owner);
        } else {
            //Mint 1 FINDR token for the owner of the accepted review and 1 for the rewards to all the stakers of the restaurant
            FINDRTokenAddress.mintReward(aiRequest.owner, 100000000);
            FINDRTokenAddress.mintReward(address(this), 100000000);
            restaurants[aiRequest.restaurantId].totalStakeRewards += 100000000;
            emit ReviewAdded(aiRequest.restaurantId, aiRequest.reviewHash, aiRequest.owner);
        }
    }

    function getRestaurantDetails(uint _restaurantId) public view returns(uint, uint, uint, string memory) {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        Restaurant memory restaurant = restaurants[_restaurantId];
        return (restaurant.restaurantId, restaurant.stakedFINDRTokens, restaurant.totalStakeRewards,
            restaurant.details);
    }

    function getRestaurantReviewHashes(uint _restaurantId) public view returns(bytes32[] memory) {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        return restaurants[_restaurantId].reviewHashes;
    }

    //Find restaurants by id and add stake/ unstake functions
    function stakeRestaurant(uint _restaurantId, uint _stakedFINDRTokens) public payable checkAllowance(_stakedFINDRTokens) {
        //First staker of a restaurant will create the restaurant on the blockchain
        if (restaurants[_restaurantId].restaurantId == 0) {
            addRestaurant(_restaurantId, "");
        }
        FINDRTokenAddress.transferFrom(msg.sender, address(this), _stakedFINDRTokens);
        stakeBalanceInfo[_restaurantId][msg.sender] += _stakedFINDRTokens;
        restaurants[_restaurantId].stakedFINDRTokens += _stakedFINDRTokens;
    }

    //Unstake restaurant
    function unstakeRestaurant(uint _restaurantId, uint _amountToUnstake) public {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        require(restaurants[_restaurantId].stakedFINDRTokens >= _amountToUnstake, "Not enough tokens staked");
        restaurants[_restaurantId].stakedFINDRTokens -= _amountToUnstake;
        stakeBalanceInfo[_restaurantId][msg.sender] -= _amountToUnstake;
        FINDRTokenAddress.transfer(msg.sender, _amountToUnstake);
    }

    /// @dev User can claim rewards for a restaurant if they have staked tokens for it
    function claimReward(uint _restaurantId) public {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        require(stakeBalanceInfo[_restaurantId][msg.sender] > 0, "No tokens staked");

        uint totalStake = restaurants[_restaurantId].stakedFINDRTokens;
        uint userStake = stakeBalanceInfo[_restaurantId][msg.sender];

        require(totalStake >= userStake, "Error: user stake exceeds total stake");

        // Calculate the user's percentage of the total stake
        uint percentOfTotalStake = userStake.mul(1e18).div(totalStake); // 1e18 is used to add precision

        uint totalReward = restaurants[_restaurantId].totalStakeRewards;

        // Calculate the user's reward
        uint reward = totalReward.mul(percentOfTotalStake).div(1e18); // Divide by 1e18 to remove the added precision

        // Transfer the reward + the user's staked tokens to the user
        FINDRTokenAddress.transfer(msg.sender, userStake + reward);

        // Subtract the reward from the total rewards
        restaurants[_restaurantId].totalStakeRewards = totalReward.sub(reward);

        //Subtract the user's stake from the total stake in the restaurant and balance info
        restaurants[_restaurantId].stakedFINDRTokens = totalStake.sub(userStake);
        stakeBalanceInfo[_restaurantId][msg.sender] = 0;
    }

    // Modifier to check token allowance of a user to this contract
    modifier checkAllowance(uint amount) {
        require(FINDRTokenAddress.allowance(msg.sender, address(this)) >= amount, "Token allowance not sufficient");
        _;
    }

    modifier onlyAIFunctionsClient() {
        require(msg.sender == address(_aiFunctionsClient), "Only the AIFunctionsClient contract can call this function");
        _;
    }
}
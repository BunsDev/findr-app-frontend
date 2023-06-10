// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/dev/functions/Functions.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "./FINDR.sol";

contract RestaurantInfo is FunctionsClient, ConfirmedOwner{
    using SafeMath for uint;
    using Functions for Functions.Request;

    struct Restaurant {
        uint restaurantId;
        uint stakedFINDRTokens;
        string details;
        bytes32[] reviewHashes;
    }
    struct AIRequest {
        uint restaurantId;
        bytes32 reviewHash;
        address owner;
    }

    //Chainlink related
    bytes32 public latestRequestId;
    RestaurantInfo public restaurantInfoContract;

    event AIReviewResponse(bytes32 indexed requestId, bytes result, bytes err);

    //Core data structures
    mapping(uint => Restaurant) public restaurants;
    mapping(bytes32 => address) public reviewHashToOwner;

    //For a given restauarantId, store the staked FINDR tokens for each user
    mapping(uint => mapping (address => uint)) public stakeBalanceInfo;

    //Not yet minted tokens, but will be minted when a claim is made
    mapping(address => uint) public userClaimableRewards;

    //For a given requestId from the AI, store the caller params
    mapping(bytes32 => AIRequest) aiRequestIdMap;

    uint public restaurantCount;
    FINDR public FINDRTokenAddress;

    //Chainlink AI JOB file hash. This should match the request source
    bytes32 public immutable AI_JOB_KECCAK256;

    event RestaurantAdded(uint restaurantId, string details);
    event ReviewProposed(uint restaurantId, bytes32 reviewHash, address owner);
    event ReviewAdded(uint restaurantId, bytes32 reviewHash, address owner);
    event ReviewRejected(uint restaurantId, bytes32 reviewHash, address owner);

    constructor(address oracle, bytes32 jobKeccak) FunctionsClient(oracle) ConfirmedOwner(msg.sender) {
        AI_JOB_KECCAK256 = jobKeccak;
    }

    function initialize(address _FINDRAddress) onlyOwner public {
        FINDRTokenAddress = FINDR(_FINDRAddress);
    }

    function addRestaurant(uint _restaurantId, string memory _details) public {
        require(restaurants[_restaurantId].restaurantId == 0, "Restaurant already exists");
        restaurants[_restaurantId] = Restaurant(_restaurantId, 0, _details, new bytes32[](0));
        restaurantCount++;
        emit RestaurantAdded(_restaurantId, _details);
    }

    function addReview(uint _restaurantId,
            string calldata review,
            string calldata source,
            bytes calldata secrets,
            uint64 subscriptionId,
            uint32 gasLimit) public returns (uint) {
        if (restaurants[_restaurantId].restaurantId == 0) {
            addRestaurant(_restaurantId, "");
        }
        require(_convertStringToBytes32Hash(source) == AI_JOB_KECCAK256, "Invalid AI job source file");
        bytes32 _reviewHash = _convertStringToBytes32Hash(review);
        string[] memory args = new string[](1);
        args[0] = review;
        bytes32 reqId = executeRequest(source, secrets, args, subscriptionId, gasLimit);
        aiRequestIdMap[reqId] = AIRequest(_restaurantId, _reviewHash, msg.sender);
        emit ReviewProposed(_restaurantId, _reviewHash, msg.sender);
        //bytes32 to uint
        return uint(reqId);
    }

    /// This function is called when we receive a response from the oracle
    function _afterAIResponse(bytes32 requestId, bytes memory response, bytes memory err) internal {
        AIRequest memory aiRequest = aiRequestIdMap[requestId];
        reviewHashToOwner[aiRequest.reviewHash] = aiRequest.owner;
        uint reviewAIGeneratedProbability = abi.decode(response, (uint));
        //If the probability that a review is generated by AI is more than 80%, reject it
        if (reviewAIGeneratedProbability < 80) {
            //1 FINDR token for the owner of the accepted review
            restaurants[aiRequest.restaurantId].reviewHashes.push(aiRequest.reviewHash);
            userClaimableRewards[aiRequest.owner] += 10**FINDRTokenAddress.decimals();
            emit ReviewAdded(aiRequest.restaurantId, aiRequest.reviewHash, aiRequest.owner);
        } else {
            emit ReviewRejected(aiRequest.restaurantId, aiRequest.reviewHash, aiRequest.owner);
        }
    }

    function getRestaurantDetails(uint _restaurantId) public view returns(uint, uint, string memory) {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        Restaurant memory restaurant = restaurants[_restaurantId];
        return (restaurant.restaurantId, restaurant.stakedFINDRTokens, restaurant.details);
    }

    function getRestaurantReviewHashes(uint _restaurantId) public view returns(bytes32[] memory) {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        return restaurants[_restaurantId].reviewHashes;
    }

    function getRestaurantStakeTotal(uint _restaurantId) public view returns(uint) {
        return restaurants[_restaurantId].stakedFINDRTokens;
    }

    //Find restaurants by id and add stake/ unstake functions
    function stakeRestaurant(uint _restaurantId, uint _stakedFINDRTokens) public checkAllowance(_stakedFINDRTokens) {
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

    /// @dev User can claim rewards for a restaurant if they have reviewed it and the review has been accepted by AI
    function claimReward() public {
        // Calculate the user's reward
        uint userClaimableReward = userClaimableRewards[msg.sender];
        userClaimableRewards[msg.sender] = 0;

        // Mint the reward + transfer user's staked tokens back to the user
        FINDRTokenAddress.mintReward(msg.sender, userClaimableReward);
    }

    function getClaimableReward(address a) public view returns(uint) {
        return userClaimableRewards[a]/10**FINDRTokenAddress.decimals();
    }

    //---------------------------------------ChainLink related-------------------------------------------------
    /**
 * @notice Send a review request to the AI through the DON
   *
   * @param source JavaScript source code
   * @param secrets Encrypted secrets payload
   * @param args Has one arg only. The review text to be analyzed by the AI
   * @param subscriptionId Functions billing subscription ID
   * @param gasLimit Maximum amount of gas used to call the client contract's `handleOracleFulfillment` function
   * @return Functions request ID
    */
    function executeRequest(
        string calldata source,
        bytes calldata secrets,
        string[] memory args,
        uint64 subscriptionId,
        uint32 gasLimit
    ) internal returns (bytes32) {
        Functions.Request memory req;
        req.initializeRequest(Functions.Location.Inline, Functions.CodeLanguage.JavaScript, source);
        if (secrets.length > 0) {
            req.addRemoteSecrets(secrets);
        }
        if (args.length > 0) req.addArgs(args);

        bytes32 assignedReqID = sendRequest(req, subscriptionId, gasLimit);
        latestRequestId = assignedReqID;
        return assignedReqID;
    }

    /**
    * @notice Callback that is invoked once the DON has resolved the request or hit an error
    * @dev This response is forwarded to the RestaurantInfo contract for further processing
    * @param requestId The request ID, returned by sendRequest()
    * @param response Aggregated response from the user code
    * @param err Aggregated error from the user code or from the execution pipeline
    * Either response or error parameter will be set, but never both
    */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        emit AIReviewResponse(requestId, response, err);
        _afterAIResponse(requestId, response, err);
    }

    /**
     * @notice Allows the Functions oracle address to be updated
   *
   * @param oracle New oracle address
   */
    function updateOracleAddress(address oracle) public onlyOwner {
        setOracle(oracle);
    }

//----------------------------------------------------------------------------------------------------------
    function _convertStringToBytes32Hash(string memory _review) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_review));
    }

    // Modifier to check token allowance of a user to this contract
    modifier checkAllowance(uint amount) {
        require(FINDRTokenAddress.allowance(msg.sender, address(this)) >= amount, "Token allowance not sufficient");
        _;
    }
}
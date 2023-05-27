// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RestaurantInfo {
    struct Restaurant {
        uint restaurantId;
        uint stakedFINDRTokens;
        uint totalStakeRewards;
        string details;
        bytes32[] reviewHashes;
        bytes32[] imageHashes;
    }

    mapping(uint => Restaurant) public restaurants;
    mapping(bytes32 => address) public reviewHashToOwner;
    mapping(bytes32 => address) public imageHashToOwner;

    //Is this necessary?
    mapping(uint => mapping (address => uint)) public stakeBalanceInfo;

    uint public restaurantCount;
    IERC20 public FINDRTokenAddress;

    event RestaurantAdded(uint restaurantId, uint stakedFINDRTokens, string details);
    event ReviewAdded(uint restaurantId, bytes32 reviewHash);
    event ImageAdded(uint restaurantId, bytes32 imageHash);

    //Add a constructor to set the FINDR token address
    constructor(address _FINDRAddress) {
        FINDRTokenAddress = IERC20(_FINDRAddress);
    }

    function addRestaurant(uint _restaurantId, uint _stakedFINDRTokens, string memory _details) public {
        require(restaurants[_restaurantId].restaurantId == 0, "Restaurant already exists");
        restaurants[_restaurantId] = Restaurant(_restaurantId, _stakedFINDRTokens, 0, _details, new bytes32[](0), new bytes32[](0));
        restaurantCount++;
        emit RestaurantAdded(_restaurantId, _stakedFINDRTokens, _details);
    }

    function addReview(uint _restaurantId, bytes32 _reviewHash) public {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        restaurants[_restaurantId].reviewHashes.push(_reviewHash);
        reviewHashToOwner[_reviewHash] = msg.sender;
        emit ReviewAdded(_restaurantId, _reviewHash);
    }

    function addImage(uint _restaurantId, bytes32 _imageHash) public {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        restaurants[_restaurantId].imageHashes.push(_imageHash);
        imageHashToOwner[_imageHash] = msg.sender;
        emit ImageAdded(_restaurantId, _imageHash);
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

    function getRestaurantImageHashes(uint _restaurantId) public view returns(bytes32[] memory) {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        return restaurants[_restaurantId].imageHashes;
    }

    //Find restaurants by id and add stake/ unstake functions
    function stakeRestaurant(uint _restaurantId, uint _stakedFINDRTokens) public checkAllowance(_stakedFINDRTokens) {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
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

    function claimReward(uint _restaurantId) public {
        require(restaurants[_restaurantId].restaurantId != 0, "Restaurant does not exist");
        require(stakeBalanceInfo[_restaurantId][msg.sender] > 0, "No tokens staked");
        //TODO: Perform Math operations safely over percentages and rewards
        uint percentOfTotalStake = stakeBalanceInfo[_restaurantId][msg.sender] / restaurants[_restaurantId].stakedFINDRTokens;
        uint reward = restaurants[_restaurantId].totalStakeRewards * percentOfTotalStake;
        FINDRTokenAddress.transfer(msg.sender, reward);
        restaurants[_restaurantId].totalStakeRewards -= reward;
    }

    // Modifier to check token allowance of a user to this contract
    modifier checkAllowance(uint amount) {
        require(FINDRTokenAddress.allowance(msg.sender, address(this)) >= amount, "Token allowance not provided");
        _;
    }
}
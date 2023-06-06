// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FINDR is ERC20 {
    address public restaurantInfoContract;

    constructor(uint256 initialSupply, address restaurantInfo) ERC20("Restaurant finder token", "FINDR") {
        _mint(msg.sender, initialSupply);
        restaurantInfoContract = restaurantInfo;
    }

    //If the owner has 2FINDR balance, it should show as 2 * 10^-8 on UI
    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    //Only allow the RestaurantInfo contract as modifier to mint new FINDR tokens for rewards
    function mintReward(address account, uint256 amount) onlyRestaurantInfo public {
        require(msg.sender == address(0x0), "Only the RestaurantInfo contract can mint FINDR tokens");
        _mint(account, amount);
    }

    modifier onlyRestaurantInfo() {
        require(msg.sender == restaurantInfoContract, "Only the RestaurantInfo contract can burn FINDR tokens");
        _;
    }
}
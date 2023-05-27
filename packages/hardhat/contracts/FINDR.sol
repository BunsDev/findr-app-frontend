// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FINDR is ERC20 {
    constructor(uint256 initialSupply) ERC20("Restaurant finder token", "FINDR") {
        _mint(msg.sender, initialSupply);
    }

    //If the owner has 2FINDR balance, it should show as 2 * 10^-8 on UI
    function decimals() public view virtual override returns (uint8) {
        return 8;
    }
}
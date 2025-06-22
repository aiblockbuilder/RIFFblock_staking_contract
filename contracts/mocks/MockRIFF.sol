// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockRIFF
 * @notice A mock ERC20 token for testing the RIFFStaking contract.
 * Inherits from OpenZeppelin's ERC20 implementation and allows the owner
 * to mint new tokens.
 */
contract MockRIFF is ERC20 {
    constructor() ERC20("Mock RIFF", "mRIFF") {}

    /**
     * @notice Mints a specified amount of tokens to a given address.
     * @dev This function is open for anyone to call for ease of testing,
     * but in a real scenario, it would be protected.
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint (in wei).
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
} 
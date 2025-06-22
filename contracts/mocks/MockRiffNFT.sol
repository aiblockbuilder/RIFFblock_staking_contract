// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockRiffNFT
 * @notice A mock ERC721 token for testing the RIFFStaking contract.
 * Inherits from OpenZeppelin's ERC721 implementation and allows anyone
 * to mint an NFT for testing purposes.
 */
contract MockRiffNFT is ERC721 {
    uint256 private _tokenIds;

    constructor() ERC721("Mock Riff NFT", "mRiffNFT") {}

    /**
     * @notice Mints a new NFT to a given address.
     * @dev The tokenId is auto-incrementing for simplicity.
     * @param to The address to mint the NFT to.
     * @return The ID of the newly minted token.
     */
    function mint(address to) public returns (uint256) {
        uint256 newItemId = _tokenIds++;
        _safeMint(to, newItemId);
        return newItemId;
    }
} 
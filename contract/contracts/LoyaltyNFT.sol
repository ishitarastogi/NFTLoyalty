// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LoyaltyNFTExpress is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Mapping from user address to points
    mapping(address => uint256) private _userPoints;

    // Mapping from NFT token ID to points required for redemption
    mapping(uint256 => uint256) private _nftRedemptionPoints;

    // Events
    event PointsEarned(address indexed user, uint256 points);
    event NFTMinted(uint256 indexed tokenId, uint256 redemptionPoints);
    event NFTRedeemed(address indexed user, uint256 tokenId);

    constructor() ERC721("LoyaltyNFTExpress", "LNFT") {}

    // Function for the brand owner to mint a new NFT
    function mintNFT(
        string memory tokenURI,
        uint256 redemptionPoints
    ) external onlyOwner {
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        _safeMint(owner(), newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _nftRedemptionPoints[newTokenId] = redemptionPoints;
        emit NFTMinted(newTokenId, redemptionPoints);
    }

    // Function for users to earn points
    function earnPoints(address user, uint256 points) external onlyOwner {
        _userPoints[user] += points;
        emit PointsEarned(user, points);
    }

    // Function for users to check their points
    function checkPoints(address user) external view returns (uint256) {
        return _userPoints[user];
    }

    // Function for users to redeem NFTs using points
    function redeemNFT(uint256 tokenId) external {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "Not owner nor approved to redeem"
        );
        uint256 redemptionCost = _nftRedemptionPoints[tokenId];
        require(
            _userPoints[msg.sender] >= redemptionCost,
            "Not enough points to redeem"
        );

        _userPoints[msg.sender] -= redemptionCost;
        _transfer(owner(), msg.sender, tokenId);
        emit NFTRedeemed(msg.sender, tokenId);
    }
}

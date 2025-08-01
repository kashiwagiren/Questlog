// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import statements - bringing in OpenZeppelin's battle-tested contracts
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; // NFT with metadata storage
import "@openzeppelin/contracts/access/Ownable.sol"; // Access control for admin functions
import "@openzeppelin/contracts/utils/Counters.sol"; // Safe counter for token IDs

/**
 * @title QuestlogBadge - Soulbound Achievement NFTs
 * @dev This contract creates non-transferable NFT badges that represent completed quests/achievements
 * 
 * KEY FEATURES:
 * - Soulbound Tokens: Once minted, badges can only be burned, never transferred to another address
 * - Authorized Minters: Only approved contracts/addresses can mint new badges
 * - Metadata Storage: Each badge has associated metadata (images, descriptions, etc.)
 * 
 * HOW IT WORKS:
 * 1. Contract owner deploys QuestlogBadge and QuestMinter contracts
 * 2. QuestMinter is authorized as a minter on this contract
 * 3. Users complete quests through frontend/QuestMinter contract
 * 4. QuestMinter calls mint() function to award badges
 * 5. Badges are permanently bound to user's wallet (soulbound)
 * 
 * EXTERNAL CALLS:
 * - Called by QuestMinter.completeQuestWithMetadata() to mint badges
 * - Called by frontend to query user's badges via balanceOf(), tokenURI(), etc.
 * - Called by deployment scripts to set up minter permissions
 */
contract QuestlogBadge is ERC721URIStorage, Ownable {
    // Using OpenZeppelin's Counters library for safe token ID increment
    // This prevents integer overflow and ensures unique token IDs
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter; // Starts at 0, increments for each new badge

    // Mapping to track which addresses are authorized to mint badges
    // Key: address, Value: true if authorized, false if not
    // This is checked by the onlyMinter modifier before allowing mints
    mapping(address => bool) public minters;

    // Events - these are emitted when important actions happen and can be monitored by frontend
    event MinterAdded(address indexed account);    // When a new minter is authorized
    event MinterRemoved(address indexed account);  // When minter permissions are revoked
    event BadgeMinted(address indexed to, uint256 indexed tokenId, string uri); // When a badge is successfully minted

    /**
     * @dev Contract constructor - called once when contract is deployed
     * @param name_ The name of the NFT collection (e.g., "Questlog Badge")
     * @param symbol_ The symbol of the NFT collection (e.g., "QLB")
     * 
     * CALLED BY: Deployment scripts (DeployQuestSystem.s.sol)
     */
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        // ERC721 constructor handles the basic NFT setup
        // Ownable constructor sets msg.sender as the contract owner
    }

    /**
     * @dev Modifier to restrict function access to authorized minters only
     * This is used on the mint() function to prevent unauthorized badge creation
     * 
     * USAGE: Applied to functions that should only be called by QuestMinter contract
     */
    modifier onlyMinter() {
        require(minters[msg.sender], "QuestlogBadge: caller is not a minter");
        _; // Continue with function execution if check passes
    }

    /**
     * @dev Authorize a new address to mint badges (admin function)
     * @param account The address to grant minting permissions to
     * 
     * CALLED BY: 
     * - Contract owner during setup (via deployment scripts)
     * - Owner to authorize new minter contracts in the future
     * 
     * TYPICAL USAGE: addMinter(address(questMinterContract))
     */
    function addMinter(address account) external onlyOwner {
        require(account != address(0), "Invalid address"); // Prevent setting zero address as minter
        minters[account] = true;
        emit MinterAdded(account); // Frontend can listen for this event
    }

    /**
     * @dev Revoke minting permissions from an address (admin function)
     * @param account The address to remove minting permissions from
     * 
     * CALLED BY: Contract owner to revoke permissions if needed
     */
    function removeMinter(address account) external onlyOwner {
        minters[account] = false; // Set to false instead of deleting for gas efficiency
        emit MinterRemoved(account);
    }

    /**
     * @dev Mint a new soulbound badge to a user's wallet
     * @param to The address to receive the badge (quest completer)
     * @param uri The metadata URI pointing to badge's image/description (IPFS or HTTP)
     * @return newId The token ID of the newly minted badge
     * 
     * CALLED BY: QuestMinter.completeQuestWithMetadata() when user completes a quest
     * 
     * PROCESS:
     * 1. Increment token counter to get unique ID
     * 2. Mint NFT to user's address using OpenZeppelin's _safeMint
     * 3. Associate metadata URI with the token ID
     * 4. Emit event for frontend tracking
     */
    function mint(address to, string calldata uri) external onlyMinter returns (uint256) {
        require(to != address(0), "Invalid recipient"); // Prevent minting to zero address

        _tokenIdCounter.increment(); // Safe increment using Counters library
        uint256 newId = _tokenIdCounter.current(); // Get the new token ID
        _safeMint(to, newId); // OpenZeppelin function that safely mints NFT
        _setTokenURI(newId, uri); // Associate metadata with token ID

        emit BadgeMinted(to, newId, uri); // Event for frontend to track successful mints
        return newId; // Return token ID for confirmation
    }

    /**
     * @dev Override to prevent transfers - makes badges "soulbound"
     * This function is called before every transfer, mint, and burn operation
     * 
     * SOULBOUND LOGIC:
     * - Allow minting: from = address(0) → user address ✅
     * - Allow burning: user address → address(0) ✅  
     * - Prevent transfers: user address → another address ❌
     * 
     * @param from Address sending the token (0x0 for minting)
     * @param to Address receiving the token (0x0 for burning)
     * @param tokenId The token being transferred
     * @param batchSize Number of tokens in batch (usually 1 for NFTs)
     * 
     * CALLED BY: OpenZeppelin's ERC721 internal functions during transfers
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize // NOTE: This parameter is required by OpenZeppelin but not used in our logic
    ) internal override {
        require(
            from == address(0) || to == address(0),
            "QuestlogBadge: soulbound tokens are non-transferable"
        );
        super._beforeTokenTransfer(from, to, tokenId, batchSize); // Call parent implementation
    }

    /**
     * @dev Allow badge holders or contract owner to burn their badges
     * @param tokenId The ID of the badge to burn/destroy
     * 
     * CALLED BY:
     * - Badge holders who want to remove their badge
     * - Contract owner for administrative purposes
     * - Frontend burn badge functionality
     * 
     * NOTE: Once burned, the badge is permanently destroyed and cannot be recovered
     */
    function burn(uint256 tokenId) external {
        require(
            _isApprovedOrOwner(msg.sender, tokenId) || owner() == msg.sender,
            "QuestlogBadge: not authorized to burn"
        );
        _burn(tokenId); // OpenZeppelin function that removes token from existence
    }

    /**
     * @dev Required override to specify which interfaces this contract supports
     * @param interfaceId The interface identifier to check
     * @return bool True if this contract supports the interface
     * 
     * CALLED BY: 
     * - Other contracts to verify compatibility (e.g., marketplaces, wallets)
     * - Frontend to check what functions are available
     * 
     * NOTE: This is a standard requirement when extending multiple OpenZeppelin contracts
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage) // Specify which parent's implementation to override
        returns (bool)
    {
        return super.supportsInterface(interfaceId); // Delegate to parent implementation
    }
}

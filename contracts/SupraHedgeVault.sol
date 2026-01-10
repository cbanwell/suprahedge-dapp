// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SupraHedge Vault (MVP)
/// @author SupraHedge
/// @notice Phase-0 vault with transparent accounting and safety controls.
/// @dev Strategy + venue adapters will be added in later phases.
contract SupraHedgeVault {
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Paused(bool paused);
    event GuardianUpdated(address indexed guardian);
    event OwnerUpdated(address indexed newOwner);

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    address public owner;
    address public guardian;

    bool public paused;

    // User ETH balances (placeholder for share accounting)
    mapping(address => uint256) public balances;

    uint256 public totalAssets;

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyGuardianOrOwner() {
        require(msg.sender == owner || msg.sender == guardian, "NOT_AUTHORIZED");
        _;
    }

    modifier notPaused() {
        require(!paused, "VAULT_PAUSED");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(address _guardian) {
        owner = msg.sender;
        guardian = _guardian;
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT / WITHDRAW
    //////////////////////////////////////////////////////////////*/

    /// @notice Deposit ETH into the vault
    function deposit() public payable notPaused {
        require(msg.value > 0, "ZERO_DEPOSIT");

        balances[msg.sender] += msg.value;
        totalAssets += msg.value;

        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from the vault
    function withdraw(uint256 amount) external notPaused {
        require(amount > 0, "ZERO_WITHDRAW");
        require(balances[msg.sender] >= amount, "INSUFFICIENT_BALANCE");

        balances[msg.sender] -= amount;
        totalAssets -= amount;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "ETH_TRANSFER_FAILED");

        emit Withdraw(msg.sender, amount);
    }

    /// @notice Allow plain ETH transfers
    receive() external payable {
        deposit();
    }

    /*//////////////////////////////////////////////////////////////
                         ADMIN / SAFETY
    //////////////////////////////////////////////////////////////*/

    function setPaused(bool _paused) external onlyGuardianOrOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function setGuardian(address newGuardian) external onlyOwner {
        require(newGuardian != address(0), "ZERO_ADDRESS");
        guardian = newGuardian;
        emit GuardianUpdated(newGuardian);
    }

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_ADDRESS");
        owner = newOwner;
        emit OwnerUpdated(newOwner);
    }

    /*//////////////////////////////////////////////////////////////
                         VIEW HELPERS
    //////////////////////////////////////////////////////////////*/

    function assets() external view returns (uint256) {
        return totalAssets;
    }
}

// SPDX-License-Identifier: MIT
using System.Diagnostics.Contracts;

pragma solidity ^0.8.20;

/// @notice Minimal MVP vault stub for SupraHedge.
/// @dev This is NOT production-complete. No strategy logic yet.
contract SupraHedgeVault
{
    string public constant NAME = "SupraHedge Vault MVP";
address public owner;

event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

modifier onlyOwner() {
    require(msg.sender == owner, "NOT_OWNER");
    _;
}

constructor() {
    owner = msg.sender;
}

function setOwner(address newOwner) external onlyOwner
{
    require(newOwner != address(0), "ZERO_ADDR");
    emit OwnerChanged(owner, newOwner);
    owner = newOwner;
}

// Placeholder accounting (we’ll replace with ERC4626 later)
mapping(address => uint256) public balances;

function deposit() external payable
{
    require(msg.value > 0, "ZERO");
    balances [msg.sender] += msg.value;
    emit Deposit(msg.sender, msg.value);
}

function withdraw(uint256 amount) external {
        require(amount > 0, "ZERO");
require(balances[msg.sender] >= amount, "INSUFFICIENT");
balances[msg.sender] -= amount;
(bool ok, ) = msg.sender.call{ value: amount} ("");
require(ok, "SEND_FAIL");
emit Withdraw(msg.sender, amount);
    }

    receive() external payable
{
    deposit();
}
}

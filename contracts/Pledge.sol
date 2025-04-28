// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Pledge {
    struct Commitment {
        address user;
        string description;
        uint256 deadline;
        uint256 stakeAmount;
        bool completed;
        bool claimed;
    }

    address public immutable donationAddress;
    uint256 public totalCommitments;
    mapping(uint256 => Commitment) public commitments;
    mapping(address => uint256[]) public userCommitments;

    event CommitmentCreated(
        uint256 indexed id,
        address indexed user,
        string description,
        uint256 deadline,
        uint256 stakeAmount
    );
    event CommitmentCompleted(uint256 indexed id);
    event StakeClaimed(uint256 indexed id, address indexed user, bool success);

    constructor(address _donationAddress) {
        donationAddress = _donationAddress;
    }

    function createCommitment(
        string memory _description,
        uint256 _durationInDays
    ) external payable {
        require(msg.value > 0, "Stake amount must be greater than 0");
        require(bytes(_description).length > 0, "Description cannot be empty");

        uint256 id = totalCommitments++;
        uint256 deadline = block.timestamp + _durationInDays * 1 days;

        commitments[id] = Commitment({
            user: msg.sender,
            description: _description,
            deadline: deadline,
            stakeAmount: msg.value,
            completed: false,
            claimed: false
        });

        userCommitments[msg.sender].push(id);

        emit CommitmentCreated(
            id,
            msg.sender,
            _description,
            deadline,
            msg.value
        );
    }

    function markAsCompleted(uint256 _id) external {
        Commitment storage commitment = commitments[_id];
        require(commitment.user == msg.sender, "Not your commitment");
        require(!commitment.completed, "Already completed");
        require(block.timestamp <= commitment.deadline, "Deadline passed");

        commitment.completed = true;
        emit CommitmentCompleted(_id);
    }

    function claimStake(uint256 _id) external {
        Commitment storage commitment = commitments[_id];
        require(commitment.user == msg.sender, "Not your commitment");
        require(!commitment.claimed, "Already claimed");

        commitment.claimed = true;
        bool success;

        if (commitment.completed && block.timestamp <= commitment.deadline) {
            // User completed on time - return stake
            (success, ) = msg.sender.call{value: commitment.stakeAmount}("");
        } else {
            // User failed - donate stake
            (success, ) = donationAddress.call{value: commitment.stakeAmount}("");
        }

        emit StakeClaimed(_id, msg.sender, success);
    }

    function getUserCommitments(address _user) external view returns (uint256[] memory) {
        return userCommitments[_user];
    }

    function getCommitmentDetails(uint256 _id) external view returns (Commitment memory) {
        return commitments[_id];
    }
}
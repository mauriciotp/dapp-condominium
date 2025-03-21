// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./ICondominium.sol";
import {CondominiumLib as Lib} from "./CondominiumLib.sol";

contract Condominium is ICondominium {
    address public manager;
    mapping(uint16 => bool) public residences;
    mapping(address => uint16) public residents;
    mapping(address => bool) public counselors;

    mapping(bytes32 => Lib.Topic) public topics;
    mapping(bytes32 => Lib.Vote[]) public votings;

    constructor() {
        manager = msg.sender;

        unchecked {
            for (uint16 i = 1; i <= 2; i++) {
                for (uint16 j = 1; j <= 5; j++) {
                    for (uint16 k = 1; k <= 5; k++) {
                        residences[(i * 1000) + (j * 100) + k] = true;
                    }
                }
            }
        }
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Only the manager can do this");
        _;
    }

    modifier onlyCouncil() {
        require(
            msg.sender == manager || counselors[msg.sender],
            "Only the manager or the council can do this"
        );
        _;
    }

    modifier onlyResidents() {
        require(
            msg.sender == manager || isResident(msg.sender),
            "Only the manager or the residents can do this"
        );
        _;
    }

    function residenceExists(uint16 residence) public view returns (bool) {
        return residences[residence];
    }

    function isResident(address resident) public view returns (bool) {
        return residents[resident] > 0;
    }

    function addResident(
        address resident,
        uint16 residenceId
    ) external onlyCouncil {
        require(residenceExists(residenceId), "Residence does not exist");
        residents[resident] = residenceId;
    }

    function removeResident(address resident) external onlyManager {
        require(!counselors[resident], "A counselor cannot be removed");
        delete residents[resident];

        if (counselors[resident]) delete counselors[resident];
    }

    function setCounselor(
        address resident,
        bool isEntering
    ) external onlyManager {
        if (isEntering) {
            require(isResident(resident), "The counselor must be a resident");
            counselors[resident] = true;
        } else {
            delete counselors[resident];
        }
    }

    function setManager(address newManager) external onlyManager {
        require(newManager != address(0), "The address must be valid");
        manager = newManager;
    }

    function getTopic(
        string memory title
    ) public view returns (Lib.Topic memory) {
        bytes32 topicId = keccak256(bytes(title));

        return topics[topicId];
    }

    function topicExists(string memory title) public view returns (bool) {
        return getTopic(title).createdDate > 0;
    }

    function addTopic(
        string memory title,
        string memory description
    ) external onlyResidents {
        require(!topicExists(title), "Topic already exists");

        bytes32 topicId = keccak256(bytes(title));

        Lib.Topic memory newTopic = Lib.Topic({
            title: title,
            description: description,
            status: Lib.Status.IDLE,
            createdDate: block.timestamp,
            startDate: 0,
            endDate: 0
        });

        topics[topicId] = newTopic;
    }

    function removeTopic(string memory title) external onlyManager {
        require(topicExists(title), "Topic does not exists");

        Lib.Topic memory topic = getTopic(title);

        require(
            topic.status == Lib.Status.IDLE,
            "Only IDLE topics can be removed"
        );

        bytes32 topicId = keccak256(bytes(title));

        delete topics[topicId];
    }

    function openVoting(string memory title) external onlyManager {
        require(topicExists(title), "Topic does not exists");

        Lib.Topic memory topic = getTopic(title);

        require(
            topic.status == Lib.Status.IDLE,
            "Only IDLE topics can be open to voting"
        );

        bytes32 topicId = keccak256(bytes(title));

        topics[topicId].status = Lib.Status.VOTING;
        topics[topicId].startDate = block.timestamp;
    }

    function vote(
        string memory title,
        Lib.Options option
    ) external onlyResidents {
        require(option != Lib.Options.EMPTY, "The option cannot be EMPTY");
        require(topicExists(title), "Topic does not exists");

        Lib.Topic memory topic = getTopic(title);

        require(
            topic.status == Lib.Status.VOTING,
            "Only VOTING topics can be voted"
        );

        bytes32 topicId = keccak256(bytes(title));

        uint16 residence = residents[msg.sender];

        Lib.Vote[] memory votes = votings[topicId];

        for (uint8 i = 0; i < votes.length; i++) {
            if (votes[i].residence == residence) {
                require(false, "A residence should vote only once");
            }
        }

        Lib.Vote memory newVote = Lib.Vote({
            resident: msg.sender,
            residence: residence,
            option: option,
            timestamp: block.timestamp
        });

        votings[topicId].push(newVote);
    }

    function closeVoting(string memory title) external onlyManager {
        require(topicExists(title), "Topic does not exists");

        Lib.Topic memory topic = getTopic(title);

        require(
            topic.status == Lib.Status.VOTING,
            "Only VOTING topics can be closed"
        );

        uint8 approved = 0;
        uint8 denied = 0;
        uint8 abstentions = 0;

        bytes32 topicId = keccak256(bytes(title));
        Lib.Vote[] memory votes = votings[topicId];

        for (uint8 i = 0; i < votes.length; i++) {
            if (votes[i].option == Lib.Options.YES) {
                approved++;
            } else if (votes[i].option == Lib.Options.NO) {
                denied++;
            } else abstentions++;
        }

        if (approved > denied) topics[topicId].status = Lib.Status.APPROVED;
        else topics[topicId].status = Lib.Status.DENIED;

        topics[topicId].endDate = block.timestamp;
    }

    function numberOfVotes(
        string memory title
    ) external view returns (uint256) {
        bytes32 topicId = keccak256(bytes(title));

        return votings[topicId].length;
    }
}

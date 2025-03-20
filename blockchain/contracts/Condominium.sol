// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Condominium {
    address public manager;
    mapping(uint16 => bool) public residences;
    mapping(address => uint16) public residents;
    mapping(address => bool) public counselors;

    enum Status {
        IDLE,
        VOTING,
        APPROVED,
        DENIED
    }

    enum Options {
        EMPTY,
        YES,
        NO,
        ABSTENTION
    }

    struct Topic {
        string title;
        string description;
        Status status;
        uint256 createdDate;
        uint256 startDate;
        uint256 endDate;
    }

    struct Vote {
        address resident;
        uint16 residence;
        Options option;
        uint256 timestamp;
    }

    mapping(bytes32 => Topic) public topics;
    mapping(bytes32 => Vote[]) public votings;

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
        address counselor,
        bool isEntering
    ) external onlyManager {
        if (isEntering) {
            require(isResident(counselor), "The counselor must be a resident");
            counselors[counselor] = true;
        } else {
            delete counselors[counselor];
        }
    }

    function setManager(address newManager) external onlyManager {
        require(newManager != address(0), "The address must be valid");
        manager = newManager;
    }

    function getTopic(string memory title) public view returns (Topic memory) {
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

        Topic memory newTopic = Topic({
            title: title,
            description: description,
            status: Status.IDLE,
            createdDate: block.timestamp,
            startDate: 0,
            endDate: 0
        });

        topics[topicId] = newTopic;
    }

    function removeTopic(string memory title) external onlyManager {
        require(topicExists(title), "Topic does not exists");

        Topic memory topic = getTopic(title);

        require(topic.status == Status.IDLE, "Only IDLE topics can be removed");

        bytes32 topicId = keccak256(bytes(title));

        delete topics[topicId];
    }

    function openVoting(string memory title) external onlyManager {
        require(topicExists(title), "Topic does not exists");

        Topic memory topic = getTopic(title);

        require(
            topic.status == Status.IDLE,
            "Only IDLE topics can be open to voting"
        );

        bytes32 topicId = keccak256(bytes(title));

        topics[topicId].status = Status.VOTING;
        topics[topicId].startDate = block.timestamp;
    }

    function vote(string memory title, Options option) external onlyResidents {
        require(option != Options.EMPTY, "The option cannot be EMPTY");
        require(topicExists(title), "Topic does not exists");

        Topic memory topic = getTopic(title);

        require(
            topic.status == Status.VOTING,
            "Only VOTING topics can be voted"
        );

        bytes32 topicId = keccak256(bytes(title));

        uint16 residence = residents[msg.sender];

        Vote[] memory votes = votings[topicId];

        for (uint8 i = 0; i < votes.length; i++) {
            if (votes[i].residence == residence) {
                require(false, "A residence should vote only once");
            }
        }

        Vote memory newVote = Vote({
            resident: msg.sender,
            residence: residence,
            option: option,
            timestamp: block.timestamp
        });

        votings[topicId].push(newVote);
    }

    function closeVoting(string memory title) external onlyManager {
        require(topicExists(title), "Topic does not exists");

        Topic memory topic = getTopic(title);

        require(
            topic.status == Status.VOTING,
            "Only VOTING topics can be closed"
        );

        uint8 approved = 0;
        uint8 denied = 0;
        uint8 abstentions = 0;

        bytes32 topicId = keccak256(bytes(title));
        Vote[] memory votes = votings[topicId];

        for (uint8 i = 0; i < votes.length; i++) {
            if (votes[i].option == Options.YES) {
                approved++;
            } else if (votes[i].option == Options.NO) {
                denied++;
            } else abstentions++;
        }

        if (approved > denied) topics[topicId].status = Status.APPROVED;
        else topics[topicId].status = Status.DENIED;

        topics[topicId].endDate = block.timestamp;
    }

    function numberOfVotes(
        string memory title
    ) external view returns (uint256) {
        bytes32 topicId = keccak256(bytes(title));

        return votings[topicId].length;
    }
}

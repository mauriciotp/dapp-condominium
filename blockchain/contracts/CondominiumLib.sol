// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library CondominiumLib {
    enum Status {
        IDLE,
        VOTING,
        APPROVED,
        DENIED,
        DELETED,
        SPENT
    }

    enum Options {
        EMPTY,
        YES,
        NO,
        ABSTENTION
    }

    enum Category {
        DECISION,
        SPENT,
        CHANGE_QUOTA,
        CHANGE_MANAGER
    }

    struct Topic {
        string title;
        string description;
        Status status;
        Category category;
        uint256 amount;
        address responsible;
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

    struct TopicUpdate {
        bytes32 id;
        string title;
        Status status;
        Category category;
    }

    struct TransferReceipt {
        address to;
        uint256 amount;
        string topic;
    }

    struct Resident {
        address wallet;
        uint16 residence;
        bool isCounselor;
        bool isManager;
        uint nextPayment;
    }

    struct ResidentPage {
        Resident[] residents;
        uint total;
    }

    struct TopicPage {
        Topic[] topics;
        uint total;
    }
}

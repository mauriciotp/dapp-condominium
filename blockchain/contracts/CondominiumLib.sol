// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library CondominiumLib {
    enum Status {
        IDLE,
        VOTING,
        APPROVED,
        DENIED,
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
}

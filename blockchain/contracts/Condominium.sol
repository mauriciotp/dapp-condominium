// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Condominium {
    address public manager;
    mapping(uint16 => bool) public residences;
    mapping(address => uint16) public residents;
    mapping(address => bool) public counselors;

    constructor() {
        manager = msg.sender;

        unchecked {
            for (uint8 i = 1; i <= 2; i++) {
                for (uint8 j = 1; j <= 5; j++) {
                    for (uint8 k = 1; k <= 5; k++) {
                        residences[(i * 1000) + (j * 100) + k] = true;
                    }
                }
            }
        }
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Only manager can do this");
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
}

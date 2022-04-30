pragma solidity >=0.4.21 <0.6.0;

import "./Record.sol";

contract HealthBlock {
    string public name = "HealthBlock";

    address[] public institutions;
    address[] public patients;
    address[] public doctors;
    mapping(address => bool) public isInstitution;
    mapping(address => bool) public isPatient;
    mapping(address => bool) public isDoctor;

    constructor() public {

    }

    // Register patient
    function registerPatient() public {
        // Add user to patients array if not an institution or existing patient
        if (!isInstitution[msg.sender] && !isPatient[msg.sender]) {
            isPatient[msg.sender] = true;

            // Check that it worked
            require(isPatient[msg.sender] == true, "it doesnt work");

            patients.push(msg.sender);
        }
    }

}
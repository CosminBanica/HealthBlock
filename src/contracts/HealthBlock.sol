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
    mapping(address => string) public institutionName;
    mapping(address => string) public institutionLink;


    constructor() public {

    }

    // Register patient
    function registerPatient() public {
        // Add user to patients array if not an institution or existing patient
        if (!isInstitution[msg.sender] && !isPatient[msg.sender]) {
            isPatient[msg.sender] = true;
            patients.push(msg.sender);
        }
    }

    // Register institution
    function registerInstitution(string memory _name, string memory _link) public {
        // Add user to institutions array if not a patient/doctor or existing institution
        if (!isInstitution[msg.sender] && !isPatient[msg.sender] && !isDoctor[msg.sender]) {
            isInstitution[msg.sender] = true;
            institutions.push(msg.sender);
            institutionName[msg.sender] = _name;
            institutionLink[msg.sender] = _link;
        }
    }

}
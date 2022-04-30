pragma solidity >=0.4.21 <0.6.0;

import "./Record.sol";

contract HealthBlock {
    struct Institution {
        address institutionAddress;
        string name;
        string link;
    }

    string public name = "HealthBlock";

    Institution[] public institutions;
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
            patients.push(msg.sender);
        }
    }

    // Register institution
    function registerInstitution(string memory _name, string memory _link) public {
        // Add user to institutions array if not a patient/doctor or existing institution
        if (!isInstitution[msg.sender] && !isPatient[msg.sender] && !isDoctor[msg.sender]) {
            isInstitution[msg.sender] = true;
            institutions.push(Institution({institutionAddress: msg.sender, name: _name, link: _link}));
        }
    }

    // Register doctor
    function registerDoctor() public {
        // Add user to doctors array if not an institution or existing doctor
        if (!isInstitution[msg.sender] && !isDoctor[msg.sender]) {
            isDoctor[msg.sender] = true;
            doctors.push(msg.sender);
        }
    }

}
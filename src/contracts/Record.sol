pragma solidity >=0.4.21 <0.6.0;

contract Record {
    address public institution;
    address public patient;
    address public doctor;
    string public timestamp;
    string public link;

    constructor(address _institution, address _patient, address _doctor, string memory _timestamp, string memory _link) public {
        institution = _institution;
        patient = _patient;
        doctor = _doctor;
        timestamp = _timestamp;
        link = _link;
    }

}
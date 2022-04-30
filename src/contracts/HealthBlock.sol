pragma solidity >=0.4.21 <0.6.0;
pragma experimental ABIEncoderV2;

contract HealthBlock {
    struct Institution {
        address institutionAddress;
        string name;
        string link;
    }

    struct Record {
        address institution;
        address doctor;
        string timestamp;
        string link;
    }

    string public name = "HealthBlock";

    Institution[] public institutions;
    address[] public patients;
    address[] public doctors;
    mapping(address => bool) public isInstitution;
    mapping(address => bool) public isPatient;
    mapping(address => bool) public isDoctor;
    mapping(address => address[]) public accessList;
    mapping(address => Record[]) public records;

    // Register patient
    function registerPatient() public {
        // Add user to patients array if not an institution or existing patient
        if (!isInstitution[msg.sender] && !isPatient[msg.sender]) {
            isPatient[msg.sender] = true;
            patients.push(msg.sender);
        }
    }

    // Register institution
    function registerInstitution(string memory _name, string memory link) public {
        // Add user to institutions array if not a patient/doctor or existing institution
        if (!isInstitution[msg.sender] && !isPatient[msg.sender] && !isDoctor[msg.sender]) {
            isInstitution[msg.sender] = true;
            institutions.push(Institution({institutionAddress: msg.sender, name: _name, link: link}));
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

    // Add medical record
    function addRecord(address patient, address doctor, string memory timestamp, string memory link) public {
        // Only institutions can call this function
        require(isInstitution[msg.sender], "caller must be institution");

        // Patient and doctor must be valid
        require(isPatient[patient], "patient must be valid");
        require(isDoctor[doctor], "doctor must be valid");

        // Should also check timestamp and link

        // Add record to records array if patient and doctor are valid
        records[patient].push(Record({institution: msg.sender, doctor: doctor, timestamp: timestamp, link: link}));
    }

    // MUST CHECK NOT TO ADD TWICE
    // Share patient records with institution/doctor
    function shareRecords(address entity) public {
        // Only patients can call this function
        require(isPatient[msg.sender], "caller must be patient");

        // Can only share record with institution/doctor
        require(isInstitution[entity] || isDoctor[entity], "can only share with institution/doctor");

        // Add entity to user access list
        accessList[msg.sender].push(entity);
    }

    // Return patient records if caller has access
    function getRecords(address patient) public view returns(Record[] memory){
        // Only institution and doctors can call this function
        require(isInstitution[msg.sender] || isDoctor[msg.sender], "caller must be institution/doctor");

        // Get patient access list
        address[] memory patientAccList = accessList[patient];

        // Caller must be in patient access list
        for (uint i = 0; i < patientAccList.length; i++) {
            if (patientAccList[i] == msg.sender) {
                return records[patient];
            }
        }

        require(false, "caller is not in patient access list");
    }

    // Return all patient records to which caller has access

}
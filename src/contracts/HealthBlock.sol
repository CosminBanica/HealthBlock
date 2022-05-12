pragma solidity >=0.4.21 <0.6.0;
pragma experimental ABIEncoderV2;

/**
 * TODO Make state variables private
 * In order to limit access to certain state variables, make them private and create functions to get them
 */
contract HealthBlock {
    struct Institution {
        address institutionAddress;
        string name;
        string link;
    }

    struct Record {
        address institution;
        address doctor;
        address patient;
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
    mapping(address => address[]) private accessList;
    mapping(address => Record[]) private records;
    mapping(address => address[]) private entityHasAccessTo;

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

        // Add record to patient records array
        records[patient].push(Record({institution: msg.sender, doctor: doctor, patient: patient, timestamp: timestamp, link: link}));
    }

    // Share patient records with institution/doctor
    function shareRecords(address entity) public {
        // Only patients can call this function
        require(isPatient[msg.sender], "caller must be patient");

        // Can only share record with institution/doctor
        require(isInstitution[entity] || isDoctor[entity], "can only share with institution/doctor");

        // Add entity to user access list *if* not already in list
        address[] memory patientAccList = accessList[msg.sender];
        bool inList = false;

        for (uint i = 0; i < patientAccList.length; i++) {
            if (patientAccList[i] == entity) {
                inList = true;
            }
        }

        if (inList == false) {
            accessList[msg.sender].push(entity);
            entityHasAccessTo[entity].push(msg.sender);
        }
    }

    // Unshare records
    function unshareRecords(address entity) public {
        // Only patients can call this function
        require(isPatient[msg.sender], "caller must be patient");

        // Remove specified entity from access list
        address[] memory patientAccList = accessList[msg.sender];

        uint entityIndex = 0;
        for (uint i = 0; i < patientAccList.length; i++) {
            if (patientAccList[i] == entity) {
                entityIndex = i + 1;
                break;
            }
        }

        if (entityIndex > 0) {
            accessList[msg.sender][entityIndex - 1] = accessList[msg.sender][accessList[msg.sender].length - 1];
            accessList[msg.sender].pop();
        }

        // Remove patient from entity accessable patients
        if (entityIndex >= 0) {
            address[] memory entityAccess = entityHasAccessTo[entity];
            uint patientIndex = 0;

            for (uint i = 0; i < entityAccess.length; i++) {
                if (entityAccess[i] == msg.sender) {
                    patientIndex = i + 1;
                    break;
                }
            }

            if (patientIndex > 0) {
                entityHasAccessTo[entity][patientIndex - 1] = entityHasAccessTo[entity][entityHasAccessTo[entity].length - 1];
                entityHasAccessTo[entity].pop();
            }
        }
    }

    // Returns access list for specified patient
    function getPatientAccessList(address patient) public view returns(address[] memory) {
        // If caller is specified patient return access list
        if (patient == msg.sender) {
            return accessList[patient];
        }

        // If caller is in specified patient access list return access list
        for (uint i = 0; i < patientAccList.length; i++) {
            if (patientAccList[i] == msg.sender) {
                return accessList[patient];
            }
        }

        // If caller is not specified patient or does not have access to 
        // that patient list then return nothing
        Record[] memory emptyReturn; 
        return empt;
    }

    // Returns patients to which institution/doctor has access
    function getAccessablePatients(address entity) public view returns(address[] memory) {
        // Requires specified address to be registered patient
        require(isInstitution[entity] || isDoctor[entity], "specified address must be institution/doctor");

        return entityHasAccessTo[entity];
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

        // If caller not in patient access list, return empty list
        Record[] memory emptyReturn; 
        return emptyReturn;
    }

    // Return all patient records to which caller has access !!! Costs a lot of gas and should only be used for debugging
    function getAllRecords() public view returns(Record[] memory){
        // Only institution and doctors can call this function
        require(isInstitution[msg.sender] || isDoctor[msg.sender], "caller must be institution/doctor");

        // Array containing all records
        Record[] memory retRecords;
        address[] memory entityAccess = entityHasAccessTo[msg.sender];

        for (uint i = 0; i < entityAccess.length; i++) {
            Record[] memory patientRecords = records[entityAccess[i]];
            Record[] memory auxRecords = retRecords;

            retRecords = new Record[](auxRecords.length + patientRecords.length);

            for (uint j = 0; j < auxRecords.length; j++) {
                retRecords[j] = auxRecords[j];
            }

            for (uint j = 0; j < patientRecords.length; j++) {
                retRecords[j + auxRecords.length] = patientRecords[j];
            }
        }

        return retRecords;
    }
}
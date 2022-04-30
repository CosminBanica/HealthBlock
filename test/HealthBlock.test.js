const { assert } = require('chai')

const HealthBlock = artifacts.require('HealthBlock')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('HealthBlock', ([owner, patient, institution, doctor, doctor2]) => {
    let healthBlock

    before(async () => {
        // Load HealthBlock
        healthBlock = await HealthBlock.new()
    })

    // Write tests here
    describe('HealthBlock basic functionality', async () => {
        it('registers patient', async () => {
            let result

            // Check patient is not registered before registering
            result = await healthBlock.isPatient(patient)
            assert.equal(result.toString(), 'false', 'patient is registered before registering')

            // Register patient
            await healthBlock.registerPatient({ from: patient })

            // Check patient is registered after registering
            result = await healthBlock.isPatient(patient)
            assert.equal(result.toString(), 'true', 'patient is registered after registering')
        })

        it('registers institution', async () => {
            let result

            // Check institution is not registered before registering
            result = await healthBlock.isInstitution(institution)
            assert.equal(result.toString(), 'false', 'institution is registered before registering')

            // Register institution
            await healthBlock.registerInstitution('FakeInstitution', 'fakelink.com', { from: institution })

            // Check institution is registered after registering
            result = await healthBlock.isInstitution(institution)
            assert.equal(result.toString(), 'true', 'institution is registered after registering')

            result = await healthBlock.institutions(0)
            assert.equal(result.name, 'FakeInstitution', 'institution name is correct')
            assert.equal(result.link, 'fakelink.com', 'institution link is correct')
        })

        it('registers doctor', async () => {
            let result

            // Check doctor is not registered before registering
            result = await healthBlock.isDoctor(doctor)
            assert.equal(result.toString(), 'false', 'doctor is registered before registering')

            // Register doctor
            await healthBlock.registerDoctor({ from: doctor })

            // Check doctor is registered after registering
            result = await healthBlock.isDoctor(doctor)
            assert.equal(result.toString(), 'true', 'doctor is registered after registering')
        })

        it('adds record', async () => {
            let result

            // Add record
            await healthBlock.addRecord(patient, doctor, '11/21/11/12:00:01', 'record.link.com', { from: institution })

            // Check record is added properly
            result = await healthBlock.records(patient, 0)
            assert.equal(result.institution, institution, 'institution in record is correct')
            assert.equal(result.doctor, doctor, 'doctor in record is correct')
            assert.equal(result.timestamp, '11/21/11/12:00:01', 'institution in record is correct')
            assert.equal(result.link, 'record.link.com', 'institution in record is correct')
        })

        it ('adds institution and doctor to access list', async () => {
            let result

            // Add institution and doctor to access list
            await healthBlock.shareRecords(institution, { from: patient })
            await healthBlock.shareRecords(doctor, { from: patient })

            // Check that institution and doctor are in patient access list
            result = await healthBlock.accessList(patient, 0)
            assert.equal(result, institution, 'institution is in access list')

            result = await healthBlock.accessList(patient, 1)
            assert.equal(result, doctor, 'doctor is in access list')
        })
    })

    describe('HealthBlock records management', async () => {
        it ('returns one patient records to which caller has access', async () => {
            let result

            // Register new doctor
            await healthBlock.registerDoctor({ from: doctor2 })

            // Check that only institution has access to records
            result = await healthBlock.getRecords(patient, { from: institution })
            assert.equal(result[0].timestamp, '11/21/11/12:00:01', 'institution received records that it has access to')

            result = await healthBlock.getRecords(patient, { from: doctor2 })
            assert.equal(result.length, 0, 'doctor received no records')
        })

        it ('returns all patient records to which caller has access', async () => {
            let result

            // Add 2 more records
            await healthBlock.addRecord(patient, doctor, '16/05/11/09:40:39', 'new.link.com', { from: institution })
            await healthBlock.addRecord(patient, doctor2, '12/03/12/15:44:42', 'helloworld.link.com', { from: institution })

            // Check that only institution receives all records
            result = await healthBlock.getAllRecords({ from: institution })
            assert.equal(result[1].timestamp, '16/05/11/09:40:39', 'institution received all records that it has access to')
            assert.equal(result[2].timestamp, '12/03/12/15:44:42', 'institution received all records that it has access to')

            result = await healthBlock.getAllRecords({ from: doctor2 })
            assert.equal(result.length, 0, 'doctor received no records')
        })
    })
})
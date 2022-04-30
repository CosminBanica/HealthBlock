const { assert } = require('chai')

const HealthBlock = artifacts.require('HealthBlock')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('HealthBlock', ([owner, patient, institution, doctor]) => {
    let healthBlock

    before(async () => {
        // Load HealthBlock
        healthBlock = await HealthBlock.new()
    })

    // Write tests here
    describe('HealthBlock deployment', async () => {
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
    })
})
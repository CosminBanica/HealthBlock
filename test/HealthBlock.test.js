const { assert } = require('chai')

const HealthBlock = artifacts.require('HealthBlock')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('HealthBlock (correctness)', ([owner, patient, institution, doctor, doctor2, patient2]) => {
    let healthBlock

    before(async () => {
        // Load HealthBlock
        healthBlock = await HealthBlock.new()
    })

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

            // Add institution to access list
            await healthBlock.shareRecords(institution, { from: patient })

            // Add record
            await healthBlock.addRecord(patient, doctor, '11/21/11/12:00:01', 'record.link.com', { from: institution })

            // Check record is added properly
            result = await healthBlock.getRecords(patient, { from: institution })

            assert.equal(result[0].institution, institution, 'institution in record is correct')
            assert.equal(result[0].doctor, doctor, 'doctor in record is correct')
            assert.equal(result[0].timestamp, '11/21/11/12:00:01', 'institution in record is correct')
            assert.equal(result[0].link, 'record.link.com', 'institution in record is correct')

            // Remove institution from access list
            await healthBlock.unshareRecords(institution, { from: patient })
        })
    })

    describe('HealthBlock access list behaviour', async () => {
        it ('adds institution and doctor to access list', async () => {
            let result

            // Add institution and doctor to access list
            await healthBlock.shareRecords(institution, { from: patient })
            await healthBlock.shareRecords(doctor, { from: patient })

            // Check that institution and doctor are in patient access list
            result = await healthBlock.getPatientAccessList(patient, { from: institution })
            assert.equal(result[0], institution, 'institution is in access list')

            result = await healthBlock.getPatientAccessList(patient, { from: doctor })
            assert.equal(result[1], doctor, 'doctor is in access list')
        })

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
            
            // Register additional patient
            await healthBlock.registerPatient({ from: patient2 })

            // Add institution to access lists
            await healthBlock.shareRecords(institution, { from: patient })
            await healthBlock.shareRecords(institution, { from: patient2 })

            // Add 4 more records
            await healthBlock.addRecord(patient, doctor, '16/05/11/09:40:39', 'new.link.com', { from: institution })
            await healthBlock.addRecord(patient, doctor2, '12/03/12/15:44:42', 'helloworld.link.com', { from: institution })
            await healthBlock.addRecord(patient2, doctor, '03/05/09/01:45:22', 'patient2.link.com', { from: institution })
            await healthBlock.addRecord(patient2, doctor2, '12/06/13/17:22:54', 'anotherone.link.com', { from: institution })

            // Check that only institution receives all records
            result = await healthBlock.getAllRecords({ from: institution })
            assert.equal(result[1].timestamp, '16/05/11/09:40:39', 'institution received all records that it has access to')
            assert.equal(result[2].timestamp, '12/03/12/15:44:42', 'institution received all records that it has access to')
            assert.equal(result[3].timestamp, '03/05/09/01:45:22', 'institution received all records that it has access to')
            assert.equal(result[4].timestamp, '12/06/13/17:22:54', 'institution received all records that it has access to')

            result = await healthBlock.getAllRecords({ from: doctor2 })
            assert.equal(result.length, 0, 'doctor2 received no records')
        })

        it ('removes entity from access list', async () => {
            let result

            // Add doctor2 to patients access list
            await healthBlock.shareRecords(doctor2, { from: patient })
            await healthBlock.shareRecords(doctor2, { from: patient2 })

            // Check that institution and both doctors are in patient access list
            result = await healthBlock.getPatientAccessList(patient, { from: institution })
            assert.equal(result[0], institution, 'institution is in access list')

            result = await healthBlock.getPatientAccessList(patient, { from: doctor })
            assert.equal(result[1], doctor, 'doctor is in access list')

            result = await healthBlock.getPatientAccessList(patient, { from: doctor2 })
            assert.equal(result[2], doctor2, 'doctor is in access list')

            // Remove doctor from patient access list
            await healthBlock.unshareRecords(doctor, { from: patient })

            // Check that only doctor has been removed from patient access list
            result = await healthBlock.getPatientAccessList(patient, { from: institution })
            assert.equal(result[0], institution, 'institution is in access list')

            result = await healthBlock.getPatientAccessList(patient, { from: doctor2 })
            assert.equal(result[1], doctor2, 'doctor is in access list')

            // Check that only doctor no longer receives records (check for getAllRecords)
            result = await healthBlock.getAllRecords({ from: institution })
            assert.equal(result[1].timestamp, '16/05/11/09:40:39', 'institution received all records that it has access to')
            assert.equal(result[2].timestamp, '12/03/12/15:44:42', 'institution received all records that it has access to')
            assert.equal(result[3].timestamp, '03/05/09/01:45:22', 'institution received all records that it has access to')
            assert.equal(result[4].timestamp, '12/06/13/17:22:54', 'institution received all records that it has access to')

            result = await healthBlock.getAllRecords({ from: doctor })
            assert.equal(result.length, 0, 'doctor received no records')

            result = await healthBlock.getAllRecords({ from: doctor2 })
            assert.equal(result[1].timestamp, '16/05/11/09:40:39', 'doctor2 received all records that it has access to')
            assert.equal(result[2].timestamp, '12/03/12/15:44:42', 'doctor2 received all records that it has access to')
            assert.equal(result[3].timestamp, '03/05/09/01:45:22', 'institution received all records that it has access to')
            assert.equal(result[4].timestamp, '12/06/13/17:22:54', 'institution received all records that it has access to')

            // Check that only doctor no longer receives records (check for getRecords)
            result = await healthBlock.getRecords(patient, { from: institution })
            assert.equal(result[0].timestamp, '11/21/11/12:00:01', 'institution received records that it has access to')

            result = await healthBlock.getRecords(patient2, { from: institution })
            assert.equal(result[0].timestamp, '03/05/09/01:45:22', 'institution received records that it has access to')

            result = await healthBlock.getRecords(patient, { from: doctor })
            assert.equal(result.length, 0, 'doctor received no records')
        })
    })
})

contract('HealthBlock (performance, 10 accounts)', accounts => {
    let healthBlock
    let institution1 = accounts[1]
    let institution2 = accounts[2]
    let doctor = accounts[9]
    let result
    const gasPrice = 20

    before(async () => {
        healthBlock = await HealthBlock.new()
    })

    describe('6 patients, 2 institutions, 1 doctor', async () => { 
        it('registers 6 patients', async () => { 
            let totalGas = 0

            for (let i = 3; i < 9; i++) {
                result = await healthBlock.registerPatient({ from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it ('registers 2 institutions', async () => {
            let totalGas = 0

            result = await healthBlock.registerInstitution('FakeInstitution1', 'fakelink.com1', { from: institution1 })
            totalGas = totalGas + result.receipt.gasUsed

            result = await healthBlock.registerInstitution('FakeInstitution2', 'fakelink.com2', { from: institution2 })
            totalGas = totalGas + result.receipt.gasUsed

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it ('registers 1 doctor', async () => {
            let totalGas = 0

            result = await healthBlock.registerDoctor({ from: doctor })
            totalGas = totalGas + result.receipt.gasUsed

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('first half of patients adds first institution to their access list', async () => {
            let totalGas = 0

            for (let i = 3; i < 6; i++) {
                result = await healthBlock.shareRecords(institution1, { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('second half of patients adds second half of institutions to their access list', async () => {
            let totalGas = 0

            for (let i = 6; i < 9; i++) {
                result = await healthBlock.shareRecords(institution2, { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each patient adds doctor to their access list', async () => {
            let totalGas = 0

            for (let i = 3; i < 9; i++) {
                result = await healthBlock.shareRecords(doctor, { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('both institutions add records to all patients', async () => {
            let totalGas = 0

            for (let i = 3; i < 9; i++) {
                if (i < 6) {
                    result = await healthBlock.addRecord(accounts[i], doctor, '12/03/12/15:44:42', 'helloworld.link.com', { from: institution1 })
                    totalGas = totalGas + result.receipt.gasUsed
                } else {
                    result = await healthBlock.addRecord(accounts[i], doctor, '12/03/12/15:44:42', 'helloworld.link.com', { from: institution2 })
                    totalGas = totalGas + result.receipt.gasUsed
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each institution views their patient records', async () => {
            let totalGas = 0

            for (let i = 3; i < 9; i++) {
                if (i < 6) {
                    result = await healthBlock.getRecords.estimateGas(accounts[i], { from: institution1 })
                    totalGas = totalGas + result
                } else {
                    result = await healthBlock.getRecords.estimateGas(accounts[i], { from: institution2 })
                    totalGas = totalGas + result
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each patient views their records', async () => {
            let totalGas = 0

            for (let i = 3; i < 9; i++) {
                let result = await healthBlock.getRecords.estimateGas(accounts[i], { from: accounts[i] })
                totalGas = totalGas + result
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('all patients remove both institutions from their access lists', async () => {
            let totalGas = 0

            for (let i = 3; i < 9; i++) {
                result = await healthBlock.unshareRecords(institution1, { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            for (let i = 3; i < 7; i++) {
                result = await healthBlock.unshareRecords(institution2, { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })
    })
})

contract('HealthBlock (performance, 50 accounts)', accounts => {
    let healthBlock
    let result
    const gasPrice = 20

    before(async () => {
        healthBlock = await HealthBlock.new()
    })

    describe('40 patients, 8 institutions, 1 doctor', () => {
        it('registers 40 patients', async () => {
            let totalGas = 0

            for (let i = 9; i < 49; i++) {
                result = await healthBlock.registerPatient({ from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })
        
        it('registers 8 institutions', async () => {
            let totalGas = 0

            for (let i = 1; i < 9; i++) {
                result = await healthBlock.registerInstitution('FakeInstitution' + i, 'fakelink.com' + i, { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('registers 1 doctor', async () => {
            let totalGas = 0

            result = await healthBlock.registerDoctor({ from: accounts[49] })
            totalGas = totalGas + result.receipt.gasUsed

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it ('first half of patients add first half of institutions to their access lists', async () => {
            let totalGas = 0

            for (let i = 9; i < 29; i++) {
                for (let j = 1; j < 5; j++) {
                    result = await healthBlock.shareRecords(accounts[j], { from: accounts[i] })
                    totalGas = totalGas + result.receipt.gasUsed
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('second half of patients add second half of institutions to their access lists', async () => {
            let totalGas = 0

            for (let i = 29; i < 49; i++) {
                for (let j = 5; j < 9; j++) {
                    result = await healthBlock.shareRecords(accounts[j], { from: accounts[i] })
                    totalGas = totalGas + result.receipt.gasUsed
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each patient adds doctor to their access list', async () => {
            let totalGas = 0

            for (let i = 9; i < 49; i++) {
                result = await healthBlock.shareRecords(accounts[49], { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each institution adds records to their patients', async () => {
            let totalGas = 0

            for (let i = 1; i < 9; i++) {
                if (i < 5) {
                    for (let j = 9; j < 29; j++) {
                        result = await healthBlock.addRecord(accounts[j], accounts[49], '12/03/12/15:44:42', 'FakeLink' + j, { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                } else {
                    for (let j = 29; j < 49; j++) {
                        result = await healthBlock.addRecord(accounts[j], accounts[49], '12/03/12/15:44:42', 'FakeLink' + j, { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each institution views their patients records', async () => {
            let totalGas = 0

            for (let i = 1; i < 9; i++) {
                if (i < 5) {
                    for (let j = 9; j < 29; j++) {
                        result = await healthBlock.getRecords.estimateGas(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result
                    }
                } else {
                    for (let j = 29; j < 49; j++) {
                        result = await healthBlock.getRecords.estimateGas(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each patient views their records', async () => {
            let totalGas = 0

            for (let i = 9; i < 49; i++) {
                result = await healthBlock.getRecords.estimateGas(accounts[i], { from: accounts[i] })
                totalGas = totalGas + result
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('all patients remove institutions from their access lists', async () => {
            let totalGas = 0

            for (let i = 9; i < 49; i++) {
                if (i < 29) {
                    for (let j = 1; j < 5; j++) {
                        result = await healthBlock.unshareRecords(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                } else {
                    for (let j = 5; j < 9; j++) {
                        result = await healthBlock.unshareRecords(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })
    })
})

contract('HealthBlock (performance, 50 accounts)', accounts => {
    let healthBlock
    let result
    const gasPrice = 20

    before(async () => {
        healthBlock = await HealthBlock.new()
    })

    describe('20 patients, 28 institutions, 1 doctor', () => {
        it('registers 20 patients', async () => {
            let totalGas = 0

            for (let i = 29; i < 49; i++) {
                result = await healthBlock.registerPatient({ from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })
        
        it('registers 28 institutions', async () => {
            let totalGas = 0

            for (let i = 1; i < 29; i++) {
                result = await healthBlock.registerInstitution('FakeInstitution' + i, 'fakelink.com' + i, { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('registers 1 doctor', async () => {
            let totalGas = 0

            result = await healthBlock.registerDoctor({ from: accounts[49] })
            totalGas = totalGas + result.receipt.gasUsed

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it ('first half of patients add first half of institutions to their access lists', async () => {
            let totalGas = 0

            for (let i = 29; i < 39; i++) {
                for (let j = 1; j < 15; j++) {
                    result = await healthBlock.shareRecords(accounts[j], { from: accounts[i] })
                    totalGas = totalGas + result.receipt.gasUsed
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('second half of patients add second half of institutions to their access lists', async () => {
            let totalGas = 0

            for (let i = 39; i < 49; i++) {
                for (let j = 15; j < 29; j++) {
                    result = await healthBlock.shareRecords(accounts[j], { from: accounts[i] })
                    totalGas = totalGas + result.receipt.gasUsed
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each patient adds doctor to their access list', async () => {
            let totalGas = 0

            for (let i = 29; i < 49; i++) {
                result = await healthBlock.shareRecords(accounts[49], { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each institution adds records to their patients', async () => {
            let totalGas = 0

            for (let i = 1; i < 29; i++) {
                if (i < 15) {
                    for (let j = 29; j < 39; j++) {
                        result = await healthBlock.addRecord(accounts[j], accounts[49], '12/03/12/15:44:42', 'FakeLink' + j, { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                } else {
                    for (let j = 39; j < 49; j++) {
                        result = await healthBlock.addRecord(accounts[j], accounts[49], '12/03/12/15:44:42', 'FakeLink' + j, { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each institution views their patients records', async () => {
            let totalGas = 0

            for (let i = 1; i < 29; i++) {
                if (i < 15) {
                    for (let j = 29; j < 39; j++) {
                        result = await healthBlock.getRecords.estimateGas(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result
                    }
                } else {
                    for (let j = 39; j < 49; j++) {
                        result = await healthBlock.getRecords.estimateGas(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each patient views their records', async () => {
            let totalGas = 0

            for (let i = 29; i < 49; i++) {
                result = await healthBlock.getRecords.estimateGas(accounts[i], { from: accounts[i] })
                totalGas = totalGas + result
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('all patients remove institutions from their access lists', async () => {
            let totalGas = 0

            for (let i = 29; i < 49; i++) {
                if (i < 39) {
                    for (let j = 1; j < 15; j++) {
                        result = await healthBlock.unshareRecords(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                } else {
                    for (let j = 15; j < 29; j++) {
                        result = await healthBlock.unshareRecords(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })
    })
})

contract('HealthBlock (performance, 100 accounts)', accounts => {
    let healthBlock
    let result
    const gasPrice = 20

    before(async () => {
        healthBlock = await HealthBlock.new()
    })

    describe('80 patients, 18 institutions, 1 doctor', () => {
        it('registers 80 patients', async () => {
            let totalGas = 0

            for (let i = 19; i < 99; i++) {
                result = await healthBlock.registerPatient({ from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })
        
        it('registers 18 institutions', async () => {
            let totalGas = 0

            for (let i = 1; i < 19; i++) {
                result = await healthBlock.registerInstitution('FakeInstitution' + i, 'fakelink.com' + i, { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('registers 1 doctor', async () => {
            let totalGas = 0

            result = await healthBlock.registerDoctor({ from: accounts[99] })
            totalGas = totalGas + result.receipt.gasUsed

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it ('first half of patients add first half of institutions to their access lists', async () => {
            let totalGas = 0

            for (let i = 19; i < 59; i++) {
                for (let j = 1; j < 10; j++) {
                    result = await healthBlock.shareRecords(accounts[j], { from: accounts[i] })
                    totalGas = totalGas + result.receipt.gasUsed
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('second half of patients add second half of institutions to their access lists', async () => {
            let totalGas = 0

            for (let i = 59; i < 99; i++) {
                for (let j = 10; j < 19; j++) {
                    result = await healthBlock.shareRecords(accounts[j], { from: accounts[i] })
                    totalGas = totalGas + result.receipt.gasUsed
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each patient adds doctor to their access list', async () => {
            let totalGas = 0

            for (let i = 19; i < 99; i++) {
                result = await healthBlock.shareRecords(accounts[99], { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each institution adds records to their patients', async () => {
            let totalGas = 0

            for (let i = 1; i < 19; i++) {
                if (i < 10) {
                    for (let j = 19; j < 59; j++) {
                        result = await healthBlock.addRecord(accounts[j], accounts[99], '12/03/12/15:44:42', 'FakeLink' + j, { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                } else {
                    for (let j = 59; j < 99; j++) {
                        result = await healthBlock.addRecord(accounts[j], accounts[99], '12/03/12/15:44:42', 'FakeLink' + j, { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each institution views their patients records', async () => {
            let totalGas = 0

            for (let i = 1; i < 19; i++) {
                if (i < 10) {
                    for (let j = 19; j < 59; j++) {
                        result = await healthBlock.getRecords.estimateGas(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result
                    }
                } else {
                    for (let j = 59; j < 99; j++) {
                        result = await healthBlock.getRecords.estimateGas(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each patient views their records', async () => {
            let totalGas = 0

            for (let i = 19; i < 99; i++) {
                result = await healthBlock.getRecords.estimateGas(accounts[i], { from: accounts[i] })
                totalGas = totalGas + result
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('all patients remove institutions from their access lists', async () => {
            let totalGas = 0

            for (let i = 19; i < 99; i++) {
                if (i < 59) {
                    for (let j = 1; j < 10; j++) {
                        result = await healthBlock.unshareRecords(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                } else {
                    for (let j = 10; j < 19; j++) {
                        result = await healthBlock.unshareRecords(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })
    })
})

contract('HealthBlock (performance, 100 accounts)', accounts => {
    let healthBlock
    let result
    const gasPrice = 20

    before(async () => {
        healthBlock = await HealthBlock.new()
    })

    describe('96 patients, 2 institutions, 1 doctor', () => {
        it('registers 96 patients', async () => {
            let totalGas = 0

            for (let i = 3; i < 99; i++) {
                result = await healthBlock.registerPatient({ from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })
        
        it('registers 2 institutions', async () => {
            let totalGas = 0

            for (let i = 1; i < 3; i++) {
                result = await healthBlock.registerInstitution('FakeInstitution' + i, 'fakelink.com' + i, { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('registers 1 doctor', async () => {
            let totalGas = 0

            result = await healthBlock.registerDoctor({ from: accounts[99] })
            totalGas = totalGas + result.receipt.gasUsed

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it ('first half of patients add first institution to their access lists', async () => {
            let totalGas = 0

            for (let i = 3; i < 51; i++) {
                result = await healthBlock.shareRecords(accounts[1], { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('second half of patients add second half of institutions to their access lists', async () => {
            let totalGas = 0

            for (let i = 51; i < 99; i++) {
                result = await healthBlock.shareRecords(accounts[2], { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each patient adds doctor to their access list', async () => {
            let totalGas = 0

            for (let i = 3; i < 99; i++) {
                result = await healthBlock.shareRecords(accounts[99], { from: accounts[i] })
                totalGas = totalGas + result.receipt.gasUsed
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each institution adds records to their patients', async () => {
            let totalGas = 0

            for (let i = 1; i < 3; i++) {
                if (i < 2) {
                    for (let j = 3; j < 51; j++) {
                        result = await healthBlock.addRecord(accounts[j], accounts[99], '12/03/12/15:44:42', 'FakeLink' + j, { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                } else {
                    for (let j = 51; j < 99; j++) {
                        result = await healthBlock.addRecord(accounts[j], accounts[99], '12/03/12/15:44:42', 'FakeLink' + j, { from: accounts[i] })
                        totalGas = totalGas + result.receipt.gasUsed
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each institution views their patients records', async () => {
            let totalGas = 0

            for (let i = 1; i < 3; i++) {
                if (i < 2) {
                    for (let j = 3; j < 51; j++) {
                        result = await healthBlock.getRecords.estimateGas(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result
                    }
                } else {
                    for (let j = 51; j < 99; j++) {
                        result = await healthBlock.getRecords.estimateGas(accounts[j], { from: accounts[i] })
                        totalGas = totalGas + result
                    }
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('each patient views their records', async () => {
            let totalGas = 0

            for (let i = 3; i < 99; i++) {
                result = await healthBlock.getRecords.estimateGas(accounts[i], { from: accounts[i] })
                totalGas = totalGas + result
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })

        it('all patients remove institutions from their access lists', async () => {
            let totalGas = 0

            for (let i = 3; i < 99; i++) {
                if (i < 51) {
                    result = await healthBlock.unshareRecords(accounts[1], { from: accounts[i] })
                    totalGas = totalGas + result.receipt.gasUsed
                } else {
                    result = await healthBlock.unshareRecords(accounts[2], { from: accounts[i] })
                    totalGas = totalGas + result.receipt.gasUsed
                }
            }

            console.log(`GasUsed: ${totalGas}`);
            console.log(`ETH used: ${(gasPrice * totalGas).toString()} / 1000000000 = ${(gasPrice * totalGas / 1000000000).toString()}ETH`);
        })
    })
})


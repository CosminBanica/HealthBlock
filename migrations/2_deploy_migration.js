const HealthBlock = artifacts.require('HealthBlock')

module.exports = async function(deployer) {
    // Deploy HealthBlock
    await deployer.deploy(HealthBlock)
}
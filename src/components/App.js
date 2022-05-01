import React, { Component } from 'react'
import Web3 from 'web3'
import HealthBlock from "../abis/HealthBlock.json"
import Navbar from './Navbar'
import Home from './Home'
import './App.css'

class App extends Component {

    async componentWillMount() {
        await this.loadWeb3()
        await this.loadBlockchainData()
    }

    async loadBlockchainData() {
        const web3 = window.web3

        const accounts = await web3.eth.getAccounts()
        this.setState({ account: accounts[0] })

        const networkId = await web3.eth.net.getId()

        // Load HealthBlock
        const healthBlockData = HealthBlock.networks[networkId]
        if (healthBlockData) {
            const healthBlock = new web3.eth.Contract(HealthBlock.abi, healthBlockData.address)
            this.setState({ healthBlock })
        } else {
            window.alert('DaiToken contract not deployed to detected network.')
        }

        this.setState({ loading: false })
    }

    async loadWeb3() {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum)
            await window.ethereum.enable()
        }
        else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider)
        }
        else {
            window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
    }

    constructor(props) {
        super(props)
        this.state = {
            account: '0x0',
            healthBlock: {},
            loading: true
        }
    }

    render() {
        let content
        if (this.state.loading) {
            content = <p id="loader" className="text-center">Loading...</p>
        } else {
            content = <Home
                />
        }

        return (
            <div>
                <Navbar account={this.state.account} />
                <div className='container-fluid mt-5'>
                    <div className="row">
                        <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
                            <div className="content mr-auto ml-auto">
                                {content}                
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
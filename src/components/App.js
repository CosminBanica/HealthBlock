import React, { Component } from 'react'
import Web3 from 'web3'
import HealthBlock from "../abis/HealthBlock.json"
import Home from './Home'
import AccessList from './AccessList'
import './App.css'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Container from 'react-bootstrap/Container'
import logo from '../HB-logo.png'

class App extends Component {

    async componentWillMount() {
        await this.loadWeb3()
        await this.loadBlockchainData()
    }

    async componentDidUpdate(prevProps, prevState) {
        // if (this.state.accountType !== prevState.accountType) {
        //     await this.loadBlockchainData()
        // }
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

        // Get accountType
        let isPatient = await this.state.healthBlock.methods.isPatient(this.state.account).call()
        if (isPatient === true) {
            this.setState({ accountType: 'patient' })
        } else {
            let isDoctor = await this.state.healthBlock.methods.isDoctor(this.state.account).call()
            if (isDoctor === true) {
                this.setState({ accountType: 'doctor' })
            } else {
                let isInstitution = await this.state.healthBlock.methods.isInstitution(this.state.account).call()
                if (isInstitution === true) {
                    this.setState({ accountType: 'institution' })
                } else {
                    this.setState({ accountType: 'none' })
                }
            }
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

    registerAsPatient = () => {
        this.setState({ loading: true })
        this.state.healthBlock.methods.registerPatient().send({ from: this.state.account }).on('transactionHash', (hash) => {
            this.setState({ loading: false })
        })
    }

    registerAsDoctor = () => {
        this.setState({ loading: true })
        this.state.healthBlock.methods.registerDoctor().send({ from: this.state.account }).on('transactionHash', (hash) => {
            this.setState({ loading: false })
        })
    }
    
    registerAsInstitution = (institutionName, institutionLink) => {
        this.setState({ loading: true })
        this.state.healthBlock.methods.registerInstitution(institutionName, institutionLink).send({ from: this.state.account }).on('transactionHash', (hash) => {
            this.setState({ loading: false })
        })
    }

    setLocation = (location) => {
        this.setState({ loading: true })
        this.setState({ location: location })
        this.setState({ loading: false })
    }

    constructor(props) {
        super(props)
        this.state = {
            account: '0x0',
            healthBlock: {},
            loading: true,
            accountType: 'none',
            location: 'home'
        }
    }

    render() {
        let content
        if (this.state.loading) {
            content = <p id="loader" className="text-center">Loading...</p>
        } else {
            if (this.state.accountType === 'none') {
                content = <div>
                    <p id="loader" className="text-center">Please register an account type to continue</p>
                    <button
                    type="submit"
                    className="btn btn-link btn-block btn-sm btn-inline"
                    onClick={(event) => {
                        event.preventDefault()
                        this.registerAsPatient()
                    }}>
                        Register as patient
                    </button>

                    <button
                    type="submit"
                    className="btn btn-link btn-block btn-sm btn-inline"
                    onClick={(event) => {
                        event.preventDefault()
                        this.registerAsDoctor()
                    }}>
                        Register as doctor
                    </button>

                    <form className="mb-3 huge-padding" onSubmit={(event) => {
                        event.preventDefault()
                        let name
                        name = this.nameInput.value
                        let link
                        link = this.linkInput.value
                        this.registerAsInstitution(name, link)
                    }}>
                        <div className="input-group mb-4">
                            <label>
                                Institution name:
                                <input
                                type="text"
                                ref={(input) => { this.nameInput = input }}
                                className="form-control form-control-lg"
                                placeholder="Institution name"
                                name='name'
                                required />
                            </label>
                            <br />
                            <label>
                                Institution link:
                                <input
                                type="text"
                                ref={(input) => { this.linkInput = input }}
                                className="form-control form-control-lg"
                                placeholder="Institution link"
                                name='link'
                                required />
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary btn-block btn-lg">Register as institution</button>
                    </form>
                </div>
            } else {
                if (this.state.location === 'home') { 
                    content = <Home
                        account={this.state.account}
                        accountType={this.state.accountType}
                        healthBlock={this.state.healthBlock}
                    />
                }
                if (this.state.location === 'acclist') {
                    content = <AccessList
                        account={this.state.account}
                        accountType={this.state.accountType}
                        healthBlock={this.state.healthBlock}
                    />
                }
            }
        }

        let navbar

        if (this.state.accountType === 'patient') {
            navbar = 
            <Navbar bg="dark" variant="dark">
                <Container>
                    <Navbar.Brand href="#home">
                        <img
                            alt=""
                            src={logo}
                            width="80"
                            height="80"
                            className="d-inline-block align-top"
                        />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="#home" onClick={(event) => {
                            event.preventDefault()
                            this.setLocation('home')
                        }}>Home</Nav.Link>
                        <Nav.Link href="#acclist" onClick={(event) => {
                            event.preventDefault()
                            this.setLocation('acclist')
                        }}>Access list</Nav.Link>
                        <small className="text-secondary">
                            <small id="account">{this.state.account}</small>
                        </small>
                    </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        }

        if (this.state.accountType === 'institution') {
            navbar = 
            <Navbar bg="dark" variant="dark">
                <Container>
                    <Navbar.Brand href="#home">
                        <img
                            alt=""
                            src={logo}
                            width="80"
                            height="80"
                            className="d-inline-block align-top"
                        />
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="#home" onClick={(event) => {
                            event.preventDefault()
                            this.setLocation('home')
                        }}>Home</Nav.Link>
                        <small className="text-secondary">
                            <small id="account">{this.state.account}</small>
                        </small>
                    </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        }

        return (
            <div>
                {navbar}
                <div className='container-fluid mt-5'>
                    <div className="row">
                        <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
                            <div className="content mr-auto ml-auto mt-3">
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
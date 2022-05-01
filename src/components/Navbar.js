import React, { Component } from 'react'
import logo from '../HB-logo.png'

class Navbar extends Component {
    render() {
        return (
            <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
                <img src={logo} width="60" height="60" className="d-inline-block align-top" alt="" />

                <ul className="navbar-nav px-3">
                    <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
                        <small className="text-secondary">
                            <small id="account">{this.props.account}</small>
                        </small>
                    </li>
                </ul>
            </nav>
        );
    }
}

export default Navbar;
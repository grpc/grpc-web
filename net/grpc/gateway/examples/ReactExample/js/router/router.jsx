
import React, { Component } from 'react';
import { Router,Route,Link } from 'react-router-dom';
import Navbar from '../component/header/header';
import history from './history';
import Todo from '../component/todo/todo';

class Routers extends Component{
    render(){
        return(
            <Router history={history}>
            <div>
                <Navbar />
                <Route path='/' component={Todo} />
                </div>
            </Router>
        )
    }
}
export default Routers;
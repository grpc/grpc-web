import React,{Component} from "react";
import Routers from '../router/router'

class App extends Component{
    constructor(props){
        super(props)
    }

    render(){
        return(
            <div>
                <Routers />
            </div>
        )
    }
}
export default App
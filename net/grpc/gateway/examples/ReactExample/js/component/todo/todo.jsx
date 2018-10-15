import React,{Component} from "react";
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Checkbox from '@material-ui/core/Checkbox';
import {HelloRequest,HelloReply} from '../../protocolbuffer/todo_pb.js';
import {GreeterClient} from '../../protocolbuffer/todo_grpc_web_pb.js';
import './todo.css';


const styles = theme => ({
    container: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    textField: {
      marginLeft: theme.spacing.unit,
      marginRight: theme.spacing.unit,
    },
  });
  

class Todo extends Component{
    constructor(props){
        super(props)
        this.state={
            todo:'',
            todoList:[]
        }
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    }

    //Onchange
    onChange(ev){
        this.setState({
            todo:ev.target.value
        })
    }

    // Submit Data to gRPC server
    onSubmit(){
     var client = new GreeterClient('http://' + window.location.hostname + ':8080',null, null);
     // simple unary call
     var request = new HelloRequest();
    //  Genrating Random Number for Single Todo
     var randomNumber = Math.floor(Math.random()*1000);
     request.setId(randomNumber);
     var todo =  this.state.todo
     request.setTodo(todo)
     client.todo(request, {}, (err, response) => {
    // In order to show List in dom I am creating Array of object getId() is my id which i have defined in todo.proto file
    console.log("Response",response) 
    var todoList = []
     var todoObj = {
         id : response.getId(),
         todo : response.getTodo()
     }
     this.setState({
         todoList:this.state.todoList.concat(todoObj)
     })
     });
    }
    render(){
        const {todoList} = this.state
        return(
            <div>
                <div id="textFielddiv"> 
                <TextField id="outlined-name" label="Todo" id="textField" margin="normal" onChange={this.onChange} variant="outlined" />
                <Button variant="outlined" onClick={this.onSubmit} color="primary">Add Todo</Button>
                </div>
                {
                    (todoList.length)?
                    <div>
                    {
                        todoList.map((todo,id)=>{
                            return (
                            <div className="paperDiv" key={id}>
                            <Paper className="paperList" key={id}>
                            <h2 className="todoTxt">
                            <Checkbox className="spanList" value="checkedA"/>
                            {todo.todo}</h2>
                            </Paper>
                            </div>
                            )
                        })
                    }
                    </div>
                    :
                    <div className="paperDiv">
                    <h2 className="todoTxtNotFound">
                    Todo Not Found.</h2>
                    </div>
                }
            </div>
        )
    }
}
Todo.propTypes = {
    classes: PropTypes.object.isRequired,
  };
  
  export default withStyles(styles)(Todo);
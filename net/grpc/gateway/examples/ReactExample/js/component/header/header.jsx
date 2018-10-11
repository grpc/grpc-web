import React,{Component} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import './header.css'
import { Link } from 'react-router-dom';
import history from '../../router/history'

const styles = {
    root: {
      flexGrow: 1,
    },
    flex: {
      flexGrow: 1,
    },
    menuButton: {
      marginLeft: -12,
      marginRight: 20,
    },
  };

class Navbar extends Component{
    constructor(props){
        super(props)
       
    }
    render(){
        const { classes } = this.props;
        return(
            <div className={classes.root}>
            <AppBar position="static">
              <Toolbar>
                <IconButton className={classes.menuButton} color="inherit" aria-label="Menu">
                </IconButton>
                <Typography variant="title" color="inherit" className={classes.flex}>
                  Todo App GRPC
                </Typography>
                  <Link to="/"><Button color="inherit" id="signupbtn">Home</Button></Link>
              </Toolbar>
            </AppBar>
          </div>
        )
    }
}

Navbar.propTypes = {
    classes: PropTypes.object.isRequired,
  };
  
  export default withStyles(styles)(Navbar);
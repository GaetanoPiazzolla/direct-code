import React from "react";
import socketIOClient from "socket.io-client";
import {generateUniqueID} from "web-vitals/dist/lib/generateUniqueID";

import Editor from 'react-simple-code-editor';
import {highlight, languages} from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import './styles.css';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import axios from 'axios';

require('prismjs/components/prism-java');


const ENDPOINT = "http://localhost:4001/";

class App extends React.Component {

  LOCK_ACQUIRED = 'LOCK granted';
  LOCK_FAILED = 'LOCK unabled';
  LOCK_RELEASED = 'LOCK release';

  defaultState = {
    messages: [],
    lockStatus: this.LOCK_FAILED,
    code: 'public class Ciao { \n' +
      '   public static void main(String[] args) { \n\n   } \n' +
      '}'
  };

  state = {
    ...this.defaultState
  };

  http = axios.create();
  socket;
  uuid;

  componentDidMount() {

    this.http.get(ENDPOINT + 'latest-code').then(data => {
      if (data?.data?.code) {
        this.setState({code: data.data.code})
        this.setState({lockStatus: this.LOCK_ACQUIRED})
      }
    })

    this.socket = socketIOClient(ENDPOINT);
    this.uuid = generateUniqueID();

    this.socket.on("update-code", data => {
      if (this.uuid !== data.uuid) {
        this.setState({code: data.code});
        this.setState({lockStatus: this.LOCK_FAILED})
      }
    });

    this.socket.on("code-locked", data => {
      if (this.uuid !== data.uuid)
        this.setState({lockStatus: this.LOCK_FAILED})
    });

    this.socket.on("code-unlocked", data => {
      if (this.uuid !== data.uuid)
        this.setState({lockStatus: this.LOCK_ACQUIRED})
    })


  }

  changeEditorValue = (event) => {
    this.setState({code: event})
    this.emitCodeLocked()
    this.emitUpdateCode(event)
    this.emitCodeUnlocked()
  }

  emitUpdateCode = throttle((event) => {
    this.socket.emit("update-code", {
      uuid: this.uuid,
      code: event
    })
  }, 500)

  emitCodeLocked = debounce((event) => {
    this.socket.emit("code-locked", {
      uuid: this.uuid
    })
  }, 2000, {leading: true, trailing: false})

  emitCodeUnlocked = debounce((event) => {
    this.socket.emit("code-unlocked", {
      uuid: this.uuid
    })
  }, 2000)


  getStyle = () => {
    if (this.state.lockStatus === this.LOCK_ACQUIRED) {
      return {border: '4px solid green'}
    } else if (this.state.lockStatus === this.LOCK_FAILED) {
      return {border: '4px solid red'}
    } else {
      return {border: '4px solid yellow'}
    }
  }

  render() {

    return (

      <div className="row">

        <div className="col-10">
          <h1>Direct Code</h1>

          <fieldset style={this.getStyle()}>
            <legend><span style={{fontSize: 16, fontWeight: 'bold'}}>Write your code: {this.state.lockStatus}</span>
            </legend>
            <Editor
              value={this.state.code}
              onValueChange={this.changeEditorValue}
              highlight={code => highlight(code, languages.java, 'java')}
              padding={10}
              readOnly={this.state.lockStatus === this.LOCK_FAILED}
            />
          </fieldset>
        </div>

      </div>
    );

  }
}


export default App;

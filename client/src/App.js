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
import axios from 'axios';

require('prismjs/components/prism-java');


const ENDPOINT = "http://localhost:4001/";

class App extends React.Component {

  LOCK_ACQUIRED = 'LOCK granted';
  LOCK_FAILED = 'LOCK unabled';
  LOCK_RELEASED = 'LOCK release';

  defaultState = {
    messages: [],
    lockStatus: this.LOCK_RELEASED,
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

  releaseLock() {
    if (this.state.lockStatus === this.LOCK_ACQUIRED) {
      this.http.get(ENDPOINT + 'release-lock').then(() => {
        this.setState({lockStatus: this.LOCK_RELEASED})
      })
    }
  }

  componentDidMount() {

    this.socket = socketIOClient(ENDPOINT);
    this.uuid = generateUniqueID();

    this.socket.on("update-code", data => {
      if (this.uuid !== data.uuid)
        this.setState({code: data.code});
    });

    this.http.get(ENDPOINT + 'latest-code').then(data => {
      if (data?.data?.code) {
        this.setState({code: data.data.code})
      }
    })

    window.addEventListener("beforeunload", (ev) => {
      this.releaseLock()
    });

  }

  componentWillUnmount() {
    this.releaseLock()
  }

  changeEditorValue = (event) => {
    this.setState({code: event});
    this.emitUpdateCode(event)
  }

  emitUpdateCode = debounce((event) => {
    this.socket.emit("update-code", {
      uuid: this.uuid,
      code: event
    });
  }, 200)

  requireLock = (event) => {
    if (this.state.lockStatus !== this.LOCK_ACQUIRED) {
      this.http.get(ENDPOINT + 'require-lock').then(data => {
        if (data?.data?.granted) {
          this.setState({lockStatus: this.LOCK_ACQUIRED})
        } else {
          this.setState({lockStatus: this.LOCK_FAILED})
        }
      })
    }
  }

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
              <button style={{marginLeft: '10px'}} onClick={this.releaseLock}
                      disabled={this.state.lockStatus !== this.LOCK_ACQUIRED}>Release Lock
              </button>
              <button style={{marginLeft: '10px'}} onClick={this.requireLock}
                      disabled={this.state.lockStatus === this.LOCK_ACQUIRED}>Require Lock
              </button>
            </legend>
            <Editor
              value={this.state.code}
              onValueChange={this.changeEditorValue}
              highlight={code => highlight(code, languages.java, 'java')}
              padding={10}
              readOnly={this.state.lockStatus !== this.LOCK_ACQUIRED}
            />
          </fieldset>
        </div>

      </div>
    );

  }
}


export default App;

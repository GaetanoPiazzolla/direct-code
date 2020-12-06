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

require('prismjs/components/prism-java');


const ENDPOINT = "http://localhost:4001";

class App extends React.Component {

  defaultState = {
    time: '',
    messages: [],
    code: 'public class Ciao { \n' +
      '   public static void main(String[] args) { \n\n   } \n' +
      '}'
  };

  state = {
    ...this.defaultState
  };

  socket;
  uuid;

  componentDidMount() {

    this.socket = socketIOClient(ENDPOINT);
    this.uuid = generateUniqueID();

    this.socket.on("chat-messages", data => {
      this.setState((oldState) => (
        {
          ...oldState,
          messages: [...oldState.messages, data]
        }));
    });

    this.socket.on("update-code", data => {
      if(this.uuid !== data.uuid)
      this.setState({code: data.code});
    });

  }

  render() {

    let sendMessage = () => {
      this.socket.emit("chat-messages", this.state.message);
    }

    let renderMessages = () => {
      if (this.state.messages)
        return (<>
          {
            this.state.messages.map(mess => <p>{mess}</p>)
          }
        </>);
    };

    let handleChangeInput = (event) => {
      this.setState({message: event.target.value});
    }

    let changeEditorValue = (event) => {
      this.setState({code: event});
      emitUpdateCode(event);
    }

    let emitUpdateCode = debounce((event) => {
      this.socket.emit("update-code", {
        uuid: this.uuid,
        code: event});
    },200)

    return (

        <div class="row">

          <div class="col-10">
            <h1>Direct Code</h1>
            <fieldset>
              <legend><span style={{fontSize: 16, fontWeight: 'bold'}}>Write your code</span></legend>
              <Editor
                value={this.state.code}
                onValueChange={changeEditorValue}
                highlight={code => highlight(code, languages.java, 'java')}
                padding={10}
              />
            </fieldset>
          </div>

          <div className="col-2">
            <input value={this.state.message} onChange={handleChangeInput}/>
            <button onClick={sendMessage}>Send Message</button>
            {renderMessages()}
          </div>

        </div>
    );

  }


}

export default App;

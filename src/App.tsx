import React from 'react';
import DrawSignature from './drawSignature';
interface AppState {
  isClearing: boolean;
}
class App extends React.Component <any, AppState>{
  drawSignatureRef: any;
  constructor(props: any) {
    super(props);
    this.drawSignatureRef = React.createRef();
    this.state = {
      isClearing: false,
    }
  }

  // 切换橡皮擦的状态
  toggleClearStatus = () => {
    this.setState((preState) => {
      return { isClearing: !preState.isClearing };
    });
  }

  clearCanvas = () => {
    this.drawSignatureRef.current.clearCanvas();
  }

  resetToPreStep = () => {
    this.drawSignatureRef.current.resetToPreStep();
  }

  returnDrawImage = () => {
    this.drawSignatureRef.current.returnDrawImage();
  }

  render() {
    const { isClearing } = this.state;

    return (
      <div className="App">
        <div style={{ height: '300px', width: '100%', background: '#999' }} />
        <DrawSignature
          isClearing={isClearing}
          ref={this.drawSignatureRef}
          canvasWidth={window.innerWidth > 600 ? '500px' : `${window.innerWidth - 100}px`}
          canvasHeight={window.innerWidth > 600 ? '500px' : `${window.innerWidth - 100}px`}
        />
        <div onClick={this.clearCanvas}>清空{window.devicePixelRatio}</div>
        <div onClick={this.resetToPreStep}>撤销</div>
        <div onClick={this.toggleClearStatus}  style={{ color: isClearing ? '#3692f5': '#000' }}>橡皮擦</div>
        <div onClick={this.returnDrawImage}>保存图片</div>
        <div style={{ height: '1300px', width: '100%', background: '#999' }}></div>
      </div>
    );
  }
}

export default App;

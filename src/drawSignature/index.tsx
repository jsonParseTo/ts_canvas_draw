import React from 'react';

// canvas的默认宽高为300px * 150px,在css中为canvas定义宽高，实际上把宽高为300px * 150px的画布进行了拉伸。
// 如果在这样的情况下进行canvas绘图，你得到的图形可能就是变形的效果。

function midPointBtw(p1: any, p2: any) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2
  };
}

interface DrawSignatureProps {
    clearWidth: number; //橡皮擦的擦拭宽度，值越大擦的越多
    canvasWidth: string;
    canvasHeight: string;
}

interface DrawSignatureState {
    isClearing: Boolean; // 是否为橡皮擦状态, ture：是，false：不是（默认值）
}

class DrawSignature extends React.Component<DrawSignatureProps, DrawSignatureState> {
  static defaultProps = {
    clearWidth: 10,
  }

  isDrawing = false; // 是否为绘制状态，ture：是，false：不是（默认值）
  canvasHistory : Array<String> = []; // 每次绘制完都存一份快照，撤销时需要用到
  canvasRef: any; // 存储canvas的dom节点
  ctx: any;
  preDrawPoint: any; // 记录前一个节点的坐标
  constructor(props: any) {
    super(props);
    this.canvasRef= React.createRef();
    this.state = {
      isClearing: false, 
    };
  }

  componentDidMount() {
    this.ctx = this.canvasRef.current.getContext('2d');
    let width = this.canvasRef.current.width,height=this.canvasRef.current.height;
    this.canvasRef.current.style.width = width + "px";
    this.canvasRef.current.style.height = height + "px";
    this.canvasRef.current.height = height * window.devicePixelRatio;
    this.canvasRef.current.width = width * window.devicePixelRatio;
    this.ctx.scale(2, 2);
    console.log(this.canvasRef.current.height, this.canvasRef.current.width);
    this.ctx.fillStyle = "#ccc";
    this.ctx.fillRect(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
  }

  getPositionCommon = (e: any) => {
    const { left, top } = this.canvasRef.current.getBoundingClientRect();
    const { clientX, clientY } = (e.changedTouches && e.changedTouches.length) ? e.changedTouches[0] : e;
    const x = clientX -left;
    const y = clientY - top; 

    return { x, y };
  }

  drawStart = (e: any) => {
    console.log('start');
    e.preventDefault();
    this.isDrawing = true;
    const { x, y } = this.getPositionCommon(e);

    this.preDrawPoint = { x, y };
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  drawMove = (e: any) =>  {

    console.log('move');
    e.preventDefault();
    const { preDrawPoint } = this;
    const currentPoint = this.getPositionCommon(e);
    const { isClearing } = this.state;
    const { clearWidth } = this.props;
    if (this.isDrawing) {
      const { x, y } = midPointBtw(currentPoint, preDrawPoint);
      if (isClearing) {
        this.ctx.clearRect(x - clearWidth, y - clearWidth, clearWidth, clearWidth);
      } else {
        console.log(x, y);
        this.preDrawPoint = currentPoint;
        this.ctx.strokeStyle = '#333';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = 2;
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      }
    }
  }

  drawEnd = (e: any) => {
    console.log('end');
    e.preventDefault();

    if (this.isDrawing) {

      // this.ctx.closePath();

      // 每次操作画布都要保存快照，后面撤销使用
      this.canvasHistory.push(this.saveCanvasToImage());
      console.log(this.canvasHistory.length);
    }
    this.isDrawing = false;
  }

  clearCanvas = () => {
    this.ctx.clearRect(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
  }

  resetToPreStep = () => {
    const { canvasHistory } = this;

    if (canvasHistory.length) {
      canvasHistory.pop(); // 先将当前的快照丢弃，准备获取前一步的快照

      if (canvasHistory.length) {
        const currentCanvasIMage = canvasHistory[canvasHistory.length - 1];
        let canvasPic = new Image() as any;

        canvasPic.src = currentCanvasIMage;
        canvasPic.addEventListener('load', () => {
          this.ctx.clearRect(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
          this.ctx.drawImage(canvasPic, 0, 0);
        });
      } else {
        this.clearCanvas();
      }
    }
  }

  saveCanvasToImage = () => {
    return this.canvasRef.current.toDataURL();
  }

  returnDrawImage = () => {
      const { canvasHistory } = this;
      const res = canvasHistory.length ? canvasHistory[canvasHistory.length - 1] : ''; 
      console.log(res);
      return ;
  }
  // 切换橡皮擦的状态
  toggleClearStatus = () => {
    this.setState((preState) => {
      return { isClearing: !preState.isClearing };
    });
  }

  render() {
    const { isClearing } = this.state;

    return (
      <div className="content">
        <div style={{ height: '300px', width: '100%', background: '#999' }} />
        <div style={{ position: 'relative', overflow: 'hidden', touchAction: 'none'}}>
          <canvas
            ref={this.canvasRef}
            // onClick={(e) => { e.preventDefault(); }}
            onTouchStart={this.drawStart}
            onTouchMove={this.drawMove}
            onTouchEnd={this.drawEnd}
            onMouseDown={this.drawStart}
            onMouseMove={this.drawMove}
            onMouseUp={this.drawEnd}
            onMouseOut={this.drawEnd}
            width="600px"
            height="300px"
            style={{ userSelect: 'none' }}
          />
          <div onClick={this.clearCanvas}>清空</div>
          <div onClick={this.resetToPreStep}>撤销</div>
          <div onClick={this.toggleClearStatus}  style={{ color: isClearing ? '#3692f5': '#000' }}>橡皮擦</div>
          <div onClick={this.returnDrawImage}>保存图片</div>
        </div>
        <div style={{ height: '1300px', width: '100%', background: '#999' }}></div>
      </div>
    )
  }
}

export default DrawSignature;

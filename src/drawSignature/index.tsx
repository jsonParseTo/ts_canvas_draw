import React from 'react';

const DEVICE_PIXEL_RATIO = window.devicePixelRatio > 1 ? window.devicePixelRatio : 2; // 画布放大比例
const MAX_SPEED = 3; // 绘制最大速率
const MIN_SPEED = 0.1; // 绘制最小速率

interface DrawSignatureProps {
    clearWidth: number; //橡皮擦的擦拭宽度，值越大擦的越多
    canvasWidth: string;
    canvasHeight: string;
    maxLineWidth: number; // 绘笔的宽度最大值
    minLineWidth: number; // 绘笔的宽度最小值
    isClearing: Boolean; // 是否为橡皮擦状态, ture：是，false：不是（默认值）
    drawColor: string; // 绘笔的颜色
}

interface Point {
  x: number;
  y: number;
}

class DrawSignature extends React.Component<DrawSignatureProps, any> {
  static defaultProps = {
    clearWidth: 10,
    canvasWidth: '300px',
    canvasHeight: '150px',
    maxLineWidth: 2,
    minLineWidth: 1,
    isClearing: false,
    drawColor: '#333',
  }

  isDrawing = false; // 是否为绘制状态，ture：是，false：不是（默认值）
  canvasHistory : Array<String> = []; // 每次绘制完都存一份快照，撤销时需要用到
  canvasRef: any; // 存储canvas的dom节点
  ctx: any;
  drawPoint: Array<Point> = []; // 记录贝塞尔曲线所需的点
  preTimeStmp: number = 0;
  lastLineWidth: number = -1;

  constructor(props: any) {
    super(props);
    this.canvasRef= React.createRef();
  }

  componentDidMount() {
    const { drawColor } = this.props;
    const refRelDom = this.canvasRef.current;
    const width = refRelDom.width;
    const height = refRelDom.height;
    this.ctx = this.canvasRef.current.getContext('2d');

    refRelDom.style.width = width + "px";
    refRelDom.style.height = height + "px";
    refRelDom.height = height * DEVICE_PIXEL_RATIO;
    refRelDom.width = width * DEVICE_PIXEL_RATIO;
    this.ctx.scale(DEVICE_PIXEL_RATIO, DEVICE_PIXEL_RATIO);
    this.ctx.strokeStyle = drawColor;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.fillStyle = "#ccc";
  }

  midPointBtw(p1: Point, p2: Point) {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }
  
  getPointDistance(p1: Point, p2: Point) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  calcLineWidth( time: number , distance: number ){
    const { maxLineWidth, minLineWidth } = this.props;
    var speed = distance / time;
    var resultLineWidth;

    if( speed <= MIN_SPEED )
        resultLineWidth = maxLineWidth;
    else if ( speed >= MAX_SPEED )
        resultLineWidth = minLineWidth;
    else{
        resultLineWidth = maxLineWidth - (speed-MIN_SPEED)/(MAX_SPEED-MIN_SPEED)*(maxLineWidth-minLineWidth);
    }

    if( this.lastLineWidth === -1 ) {
      return resultLineWidth;
    }

    return resultLineWidth*1/3 + this.lastLineWidth*2/3;
  }

  getPositionCommon = (e: any) => {
    const { left, top } = this.canvasRef.current.getBoundingClientRect();
    const { clientX, clientY } = (e.changedTouches && e.changedTouches.length) ? e.changedTouches[0] : e;
    const x = clientX -left;
    const y = clientY - top; 

    return { x, y };
  }

  drawStart = (e: any) => {
    e.preventDefault();
    this.isDrawing = true;
    this.preTimeStmp = new Date().getTime();
    const { x, y } = this.getPositionCommon(e);

    this.drawPoint.push({ x, y });
  }

  drawMove = (e: any) =>  {
    e.preventDefault();

    // 如果是移动端出现多于1个手指在画布上，则取消本次任何绘制行为
    if (e.touches && e.touches.length > 1) {
      return;
    }

    const currentPoint = this.getPositionCommon(e);
    const { clearWidth, isClearing } = this.props;

    if (this.isDrawing) {
      if (isClearing) {
        this.ctx.clearRect(currentPoint.x - clearWidth, currentPoint.y - clearWidth, clearWidth, clearWidth);
      } else {
        const { drawPoint } = this;
        if (drawPoint.length <= 1) {
          drawPoint.push(currentPoint);
        } else {
          const [firstPoint, secondPoint] = drawPoint;
          const thirdPoint = this.midPointBtw(secondPoint, currentPoint);
          const currentTimeStap = new Date().getTime();
          const time = currentTimeStap - this.preTimeStmp;
          const distance = this.getPointDistance(firstPoint, thirdPoint);
          const lineWidth = this.calcLineWidth(time, distance);

          this.ctx.lineWidth = lineWidth;
          this.lastLineWidth = lineWidth;
          this.preTimeStmp = currentTimeStap;
          this.ctx.beginPath();
          this.ctx.moveTo(firstPoint.x, firstPoint.y);
          this.ctx.quadraticCurveTo(secondPoint.x, secondPoint.y, thirdPoint.x, thirdPoint.y);
          this.drawPoint = [thirdPoint, currentPoint];
          this.ctx.stroke();
          this.ctx.closePath();
        }
      }
    }
  }

  drawEnd = (e: any) => {
    e.preventDefault();

    if (this.isDrawing) {
      this.ctx.closePath();
      // 每次绘制结束都要保存快照，后面撤销使用
      this.canvasHistory.push(this.saveCanvasToImage());
    }
    this.isDrawing = false;
    this.drawPoint = [];
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
        const { width, height } = this.canvasRef.current;
        let canvasPic = new Image() as any;

        canvasPic.src = currentCanvasIMage;
        canvasPic.addEventListener('load', () => {
          this.ctx.clearRect(0, 0, width, height);
          this.ctx.drawImage(canvasPic, 0, 0, width / DEVICE_PIXEL_RATIO, height / DEVICE_PIXEL_RATIO);
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

      return res;
  }

  render() {
    const { canvasWidth, canvasHeight } = this.props;

    return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
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
            width={canvasWidth}
            height={canvasHeight}
            style={{ userSelect: 'none', backgroundColor: '#eee', touchAction: 'none' }}
          />
        </div>
    )
  }
}

export default DrawSignature;

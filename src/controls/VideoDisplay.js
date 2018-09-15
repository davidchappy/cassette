import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ResizeObserver from 'resize-observer-polyfill';

import playerContextFilter from '../factories/playerContextFilter';
import * as PlayerPropTypes from '../PlayerPropTypes';
import { logWarning } from '../utils/console';

class VideoDisplay extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      // realDisplayWidth, realDisplayHeight are in canvas display units
      realDisplayWidth: 0,
      realDisplayHeight: 0,
      // containerWidth, containerHeight are in CSS pixel units
      containerWidth: 0,
      containerHeight: 0
    };
  }

  componentDidMount () {
    // set initial canvas size to 0 to avoid weird layout glitches with
    // the default canvas size (300x150 px in Chrome)
    this.canvas.width = 0;
    this.canvas.height = 0;

    this.checkForBadStuff();
    const { displayWidth, displayHeight } = this.getDeviceDisplayDimensions();
    const {
      endStream,
      setCanvasSize
    } = this.props.pipeVideoStreamToCanvas(this.canvas, ctx => {
      this.handleFrameUpdate(ctx);
    });
    setCanvasSize(displayWidth, displayHeight);
    this.endStream = endStream;
    this.setCanvasSize = setCanvasSize;
    this.updateContainerDimensions();

    this.containerResizeObserver = new ResizeObserver(
      this.updateContainerDimensions.bind(this)
    );
    this.containerResizeObserver.observe(this.containerElement);
  }

  componentDidUpdate () {
    this.checkForBadStuff();
    const { displayWidth, displayHeight } = this.getDeviceDisplayDimensions();
    this.setCanvasSize(displayWidth, displayHeight);
    this.updateContainerDimensions();
  }

  componentWillUnmount () {
    this.endStream();
    this.containerResizeObserver.disconnect();
  }

  checkForBadStuff () {
    if (
      !this.warnedAboutBadStuff &&
      this.props.processFrame &&
      !this.props.displayWidth &&
      !this.props.displayHeight
    ) {
      logWarning(
        'VideoDisplay: Supplying a processFrame function without also ' +
        'giving a displayWidth or displayHeight means the video will be ' +
        'processed at the full resolution. This may lead to a poor framerate.'
      );
      this.warnedAboutBadStuff = true;
    }
  }

  updateContainerDimensions () {
    const { offsetWidth, offsetHeight } = this.containerElement;
    this.setState(state => {
      if (offsetWidth === state.containerWidth
        && offsetHeight === state.containerHeight) {
        return null;
      }
      return {
        containerWidth: offsetWidth,
        containerHeight: offsetHeight
      };
    });
  }

  getDeviceDisplayDimensions () {
    const { displayWidth, displayHeight, scaleForDevicePixelRatio } = this.props;
    const scale = scaleForDevicePixelRatio && window.devicePixelRatio || 1;
    return {
      displayWidth: displayWidth && (scale * displayWidth),
      displayHeight: displayHeight && (scale * displayHeight)
    };
  }

  handleFrameUpdate (canvasContext) {
    const { width, height } = this.canvas;
    if (width && height) {
      this.setState(state => {
        if (width === state.realDisplayWidth
          && height === state.realDisplayHeight) {
          return null;
        }
        return {
          realDisplayWidth: width,
          realDisplayHeight: height
        };
      });
    }
    if (!(this.props.processFrame && width && height)) {
      return;
    }
    const frameData = canvasContext.getImageData(0, 0, width, height);
    const newFrameData = this.props.processFrame(frameData);
    if (newFrameData instanceof ImageData) {
      canvasContext.putImageData(newFrameData, 0, 0);
      return;
    }
    if (!this.warnedAboutNoImageData) {
      logWarning(
        'The processFrame function should return an ImageData object. ' +
        'Normally you\'ll just mutate the provided ImageData and ' +
        'return it.'
      );
      this.warnedAboutNoImageData = true;
    }
  }

  render () {
    const { background, ...attributes } = this.props;
    delete attributes.pipeVideoStreamToCanvas;
    delete attributes.processFrame;
    delete attributes.displayWidth;
    delete attributes.displayHeight;
    delete attributes.scaleForDevicePixelRatio;

    const {
      realDisplayWidth,
      realDisplayHeight,
      containerWidth,
      containerHeight
    } = this.state;

    const canvasStyle = {};
    if (realDisplayWidth
      && realDisplayHeight
      && containerWidth
      && containerHeight) {
      const realDisplayRatio = realDisplayWidth / realDisplayHeight;
      const containerRatio = containerWidth / containerHeight;
      if (realDisplayRatio === containerRatio) {
        canvasStyle.width = containerWidth;
        canvasStyle.height = containerHeight;
      } else if (realDisplayRatio > containerRatio) {
        // video is wider than container - scale with bars on top and bottom
        canvasStyle.width = containerWidth;
        canvasStyle.height = containerWidth / realDisplayRatio;
      } else {
        // video is taller than container - scale with bars on left and right
        canvasStyle.height = containerHeight;
        canvasStyle.width = containerHeight * realDisplayRatio;
      }
    }

    return (
      <div
        {...attributes}
        style={{
          ...(attributes.style || {}),
          background,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        ref={elem => this.containerElement = elem}
      >
        <canvas style={canvasStyle} ref={elem => this.canvas = elem} />
      </div>
    );
  }
}

VideoDisplay.propTypes = {
  pipeVideoStreamToCanvas: PropTypes.func.isRequired,
  /* TODO: for documentation
  We might want to use this grayscale function in an example
    processFrame: function (frameData) {
      for (let i = 0; i < frameData.data.length; i += 4) {
        const r = frameData.data[i + 0];
        const g = frameData.data[i + 1];
        const b = frameData.data[i + 2];

        // convert to simple grayscale
        const average = (r + g + b) / 3;
        frameData.data[i + 0] = average;
        frameData.data[i + 1] = average;
        frameData.data[i + 2] = average;
      }
      return frameData;
    }
  */
  processFrame: PropTypes.func,
  displayWidth: PropTypes.number,
  displayHeight: PropTypes.number,
  scaleForDevicePixelRatio: PropTypes.bool.isRequired,
  background: PropTypes.string.isRequired
};

VideoDisplay.defaultProps = {
  scaleForDevicePixelRatio: true,
  background: '#000'
};

export default playerContextFilter(VideoDisplay, ['pipeVideoStreamToCanvas']);

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ResizeObserver from 'resize-observer-polyfill';

const getNow =
  typeof performance !== 'undefined' && performance.now
    ? () => performance.now()
    : () => Date.now();

function pxToNum(px) {
  return Number(px.slice(0, -2));
}

function numToPx(num) {
  return `${num}px`;
}

class MaybeMarquee extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      contentHeight: 0
    };

    this.moveMarquee = this.moveMarquee.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.animationFrameRequest = requestAnimationFrame(this.moveMarquee);

    this.marqueeContainerElementWidth = getComputedStyle(
      this.marqueeContainerElement
    ).width;
    const contentStyle = getComputedStyle(this.movingContentContainerElement);
    this.movingContentContainerElementWidth = contentStyle.width;
    this.setState({
      contentHeight: contentStyle.height
    });

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.marqueeContainerElement);
    this.resizeObserver.observe(this.movingContentContainerElement);

    this.lastMovementTime = getNow();
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animationFrameRequest);
    this.resizeObserver.disconnect();
  }

  moveMarquee() {
    const { pixelsPerSecond, scrollDirection } = this.props;

    const now = getNow();
    const dt = now - this.lastMovementTime;
    this.lastMovementTime = now;

    if (scrollDirection === 'left') {
      this.movingContentContainerElement.style.right = undefined;
    } else {
      this.movingContentContainerElement.style.left = undefined;
    }

    if (
      this.marqueeContainerElementWidth >=
      this.movingContentContainerElementWidth
    ) {
      // no scrolling since all the content fits
      this.movingContentContainerElement.style[scrollDirection] = 0;
    } else {
      const movementInPixels = (pixelsPerSecond * dt) / 1000;

      const newOffset =
        pxToNum(this.movingContentContainerElement.style[scrollDirection]) -
        movementInPixels;
      if (newOffset > 0 - this.movingContentContainerElementWidth) {
        // we still have room to scroll.. keep going
        this.movingContentContainerElement.style[scrollDirection] = numToPx(
          newOffset
        );
      } else {
        // the content is off the screen so we should wrap around
        this.movingContentContainerElement.style[scrollDirection] = numToPx(
          this.marqueeContainerElementWidth
        );
      }
    }

    this.animationFrameRequest = requestAnimationFrame(this.moveMarquee);
  }

  handleResize(entries) {
    for (const entry of entries) {
      if (entry.target === this.marqueeContainerElement) {
        this.marqueeContainerElementWidth = entry.contentRect.width;
      }
      if (entry.target === this.movingContentContainerElement) {
        this.movingContentContainerElementWidth = entry.contentRect.width;
        this.setState({
          contentHeight: entry.contentRect.height
        });
      }
    }
  }

  render() {
    return (
      <div
        ref={elem => (this.marqueeContainerElement = elem)}
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: this.state.contentHeight
        }}
      >
        <div
          ref={elem => (this.movingContentContainerElement = elem)}
          style={{ position: 'absolute', whiteSpace: 'nowrap' }}
        >
          {this.props.content}
        </div>
      </div>
    );
  }
}

MaybeMarquee.propTypes = {
  content: PropTypes.node.isRequired,
  pixelsPerSecond: PropTypes.number.isRequired,
  scrollDirection: PropTypes.oneOf(['left', 'right']).isRequired
};

MaybeMarquee.defaultProps = {
  pixelsPerSecond: 30,
  scrollDirection: 'left'
};

export default MaybeMarquee;

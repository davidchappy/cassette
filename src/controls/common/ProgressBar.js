import React from 'react';
import PropTypes from 'prop-types';
import ResizeObserver from 'resize-observer-polyfill';

import ProgressBarDisplay from './ProgressBarDisplay';
import PurePropTypesComponent from './PurePropTypesComponent';
import convertToNumberWithinIntervalBounds from '../../utils/convertToNumberWithinIntervalBounds';

class ProgressBar extends PurePropTypesComponent {
  constructor (props) {
    super(props);

    this.progressContainer = null;

    // bind methods fired on React events
    this.setProgressContainerRef = this.setProgressContainerRef.bind(this);
    this.handleAdjustProgress = this.handleAdjustProgress.bind(this);

    // bind listeners to add on mount and remove on unmount
    this.handleAdjustComplete = this.handleAdjustComplete.bind(this);
  }

  componentDidMount () {
    // add event listeners bound outside the scope of our component
    window.addEventListener('mousemove', this.handleAdjustProgress);
    document.addEventListener('touchmove', this.handleAdjustProgress);
    window.addEventListener('mouseup', this.handleAdjustComplete);
    document.addEventListener('touchend', this.handleAdjustComplete);
  }

  componentWillUnmount () {
    // remove event listeners bound outside the scope of our component
    window.removeEventListener('mousemove', this.handleAdjustProgress);
    document.removeEventListener('touchmove', this.handleAdjustProgress);
    window.removeEventListener('mouseup', this.handleAdjustComplete);
    document.removeEventListener('touchend', this.handleAdjustComplete);
  }

  setProgressContainerRef (ref) {
    this.progressContainer = ref;
  };

  handleAdjustProgress (event) {
    const { readonly, adjusting, onAdjustProgress } = this.props;
    if (readonly) {
      return;
    }
    // make sure we don't select stuff in the background
    if (event.type === 'mousedown' || event.type === 'touchstart') {
      document.body.classList.add('rr_audio_player__noselect');
    } else if (!adjusting) {
      return;
    }
    /* we don't want mouse handlers to receive the event
     * after touch handlers, so prevent default
     */
    event.preventDefault();
    const isTouch = event.type.slice(0, 5) === 'touch';
    const pageX = isTouch ? event.targetTouches.item(0).pageX : event.pageX;
    const boundingRect = this.progressContainer.getBoundingClientRect();
    const position = pageX - boundingRect.left - document.body.scrollLeft;
    const progress = position / boundingRect.width;
    const progressInBounds = convertToNumberWithinIntervalBounds(progress, 0, 1);
    onAdjustProgress(progressInBounds);
  }

  handleAdjustComplete (event) {
    const { adjusting, onAdjustComplete } = this.props;
    /* this function is activated when the user lets go of
     * the mouse, so if .rr_audio_player__noselect was applied
     * to the document body, get rid of it.
     */
    document.body.classList.remove('rr_audio_player__noselect');
    if (!adjusting) {
      return;
    }
    /* we don't want mouse handlers to receive the event
     * after touch handlers, so prevent default
     */
    event.preventDefault();
    if (typeof onAdjustComplete === 'function') {
      onAdjustComplete();
    }
  }

  render () {
    const { className, style, progress } = this.props;
    return (
      <ProgressBarDisplay
        progressBarRef={this.setProgressContainerRef}
        className={className}
        style={style}
        progress={progress}
        onMouseDown={this.handleAdjustProgress}
        onTouchStart={this.handleAdjustProgress}
      />
    );
  }
}

ProgressBar.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  progress: PropTypes.number.isRequired,
  adjusting: PropTypes.bool.isRequired,
  readonly: PropTypes.bool.isRequired,
  onAdjustProgress: PropTypes.func.isRequired,
  onAdjustComplete: PropTypes.func
};

ProgressBar.defaultProps = {
  readonly: false
};

module.exports = ProgressBar;
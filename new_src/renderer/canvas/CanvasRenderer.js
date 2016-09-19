import { rendererLogger as logger } from '../../configuration/LoggerConfig';

export * from './MathCanvasRenderer';

/*export * from './MusicCanvasRenderer';
export * from './ShapeCanvasRenderer';
export * from './StrokeCanvasRenderer';
export * from './TextCanvasRenderer';*/

/**
 * Tool to create canvas
 *
 * @private
 * @param {Element} parent
 * @param {String} id
 * @returns {Element}
 */
function createCanvas(renderDomElement, id) {
  // eslint-disable-next-line no-undef
  const browserDocument = document;
  const count = browserDocument.querySelectorAll('canvas[id^=' + id + ']').length;
  const canvas = browserDocument.createElement('canvas');
  canvas.id = id + '-' + count;
  renderDomElement.appendChild(canvas);
  return canvas;
}


function performUpdateCanvasSizeToParentOne(renderDomElement, canvas) {
  logger.info('Updating canvasSize ', canvas.id, ' in ', renderDomElement.id);
  /* eslint-disable no-param-reassign */
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  /* eslint-enable no-param-reassign */
  canvas.getContext('2d').scale(1, 1);
  //TODO Manage a ration for retina devices
}

export function updateCanvasSizeToParentOne(renderDomElement, renderStructure, model, stroker) {
  performUpdateCanvasSizeToParentOne(renderDomElement, renderStructure.renderingCanvas);
  performUpdateCanvasSizeToParentOne(renderDomElement, renderStructure.capturingCanvas);
  this.drawModel(renderStructure, model, stroker);
}


/**
 * Populate the dom element
 * @param renderDomElement
 * @returns The structure to give as paramter when a draw model will be call {{renderingCanvas: Element, renderingCanvasContext: CanvasRenderingContext2D, capturingCanvas: Element, capturingCanvasContext: CanvasRenderingContext2D}}
 */
export function populateRenderDomElement(renderDomElement) {
  logger.debug('Populate dom elements for rendering inside  ', renderDomElement.id);
  const renderingCanvas = createCanvas(renderDomElement, 'ms-rendering-canvas');
  performUpdateCanvasSizeToParentOne(renderDomElement, renderingCanvas);
  const capturingCanvas = createCanvas(renderDomElement, 'ms-capture-canvas');
  performUpdateCanvasSizeToParentOne(renderDomElement, capturingCanvas);
  return {
    renderingCanvas,
    renderingCanvasContext: renderingCanvas.getContext('2d'),
    capturingCanvas,
    capturingCanvasContext: capturingCanvas.getContext('2d')
  };
}

/**
 * Clear the recognition context
 *
 * @method clear
 */
export function clear(renderStructure) {
  renderStructure.capturingCanvasContext.clearRect(0, 0, renderStructure.capturingCanvas.width, renderStructure.capturingCanvas.height);
  renderStructure.renderingCanvasContext.clearRect(0, 0, renderStructure.renderingCanvas.width, renderStructure.renderingCanvas.height);
}

export function drawModel(renderStructure, model, stroker) {
  renderStructure.capturingCanvasContext.clearRect(0, 0, renderStructure.capturingCanvas.width, renderStructure.capturingCanvas.height);


  //FIXME We need to manage parameters
  const emptyParamaters = {};
  this.clear(renderStructure);
  this.drawPendingStrokes(renderStructure, model, stroker);
  const self = this;

  function drawShapePrimitive(primitive) {
    logger.debug('Attempting to draw shape primitive', primitive.type);
    self.drawShapePrimitive(primitive, renderStructure.renderingCanvasContext, emptyParamaters);
  }

  function drawSymbol(symbol) {
    logger.debug('Attempting to draw symbol', symbol.elementType);
    //Displaying the text lines
    if (symbol.elementType === 'textLine') {
      self.drawShapeTextLine(symbol, renderStructure.renderingCanvasContext, emptyParamaters);
    }

    //Displaying the primitives
    if (symbol.primitives) {
      switch (symbol.elementType) {
        case 'shape':
          symbol.primitives.forEach(drawShapePrimitive);
          break;
        default:
          logger.info('Unable to draw ', symbol.elementType);
          break;
      }
    }
  }

  //Displaying the pending strokes
  self.drawPendingStrokes(renderStructure, model, stroker);

  self.drawConvertedStrokes(renderStructure, model, stroker);

  if (model.recognizedComponents.symbolList) {
    model.recognizedComponents.symbolList.forEach(drawSymbol);
  }
}

export function drawShapeSymbol(renderStructure, symbol) {
  logger.debug('Shape primitive not managed in this mode');
}

export function drawMusicSymbol(component) {
  logger.debug('Music primitive not managed in this mode');
}

export function drawMathSymbol() {
  logger.debug('Math primitive not managed in this mode');
}

export function drawTextPrimitive() {
  logger.debug('Text primitive not managed in this mode');
}

export function drawCurrentStroke(renderStructure, model, stroker) {
  logger.debug('drawCurrentStroke not managed in this mode');
}

export function drawPendingStrokes(renderStructure, model, stroker) {
  logger.debug('drawPendingStrokes not managed in this mode');
}


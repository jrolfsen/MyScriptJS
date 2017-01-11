import { recognizerLogger as logger } from '../../../configuration/LoggerConfig';
import * as NetworkWSInterface from '../../networkHelper/websocket/networkWSInterface';
import * as Cdkv3WSWebsocketBuilder from './Cdkv3WSBuilder';
import * as PromiseHelper from '../../../util/PromiseHelper';
import * as InkModel from '../../../model/InkModel';
import * as StrokeComponent from '../../../model/StrokeComponent';
import { updateRecognitionPositions, resetRecognitionPositions } from '../../../model/RecognizerContext';
import MyScriptJSConstants from '../../../configuration/MyScriptJSConstants';

/**
 * Get the authorized triggers
 * @return {Array<String>} Available recognition triggers
 */
export function getAvailableRecognitionTriggers() {
  return [MyScriptJSConstants.RecognitionTrigger.PEN_UP];
}

function buildUrl(options, suffixUrl) {
  const scheme = (options.recognitionParams.server.scheme === 'https') ? 'wss' : 'ws';
  return scheme + '://' + options.recognitionParams.server.host + suffixUrl;
}

/**
 * Init the websocket recognizer.
 * Open the connexion and proceed to the hmac challenge.
 * A recognizer context is build as such :
 * @param {String} suffixUrl
 * @param {Options} options
 * @param {RecognizerContext} recognizerContext
 * @return {Promise} Fulfilled when the init phase is over.
 */
export function init(suffixUrl, options, recognizerContext) {
  const recognizerContextReference = recognizerContext;
  const url = buildUrl(options, suffixUrl);
  const destructuredInitPromise = PromiseHelper.destructurePromise();

  logger.debug('Opening the websocket for context ', recognizerContextReference);
  const initCallback = Cdkv3WSWebsocketBuilder.buildWebSocketCallback(destructuredInitPromise, recognizerContextReference, options);
  recognizerContextReference.websocket = NetworkWSInterface.openWebSocket(url, initCallback);
  recognizerContextReference.recognitionContexts = [];

  // Feeding the recognitionContext
  recognizerContextReference.initPromise = destructuredInitPromise.promise;

  destructuredInitPromise.promise.then(
      (value) => {
        logger.debug('Init over ' + value);
      }
  ).catch(
      (error) => {
        logger.error('fatal error while loading recognizer');
      }
  );
  return recognizerContextReference.initPromise;
}

/**
 * Do what is needed to clean the server context.
 * @param {Options} options Current configuration
 * @param {Model} model Current model
 * @param {RecognizerContext} recognizerContext Current recognizer context
 * @return {Promise}
 */
export function reset(options, model, recognizerContext) {
  const recognizerContextReference = recognizerContext;
  resetRecognitionPositions(recognizerContext, model);
  if (recognizerContextReference && recognizerContextReference.websocket) {
    // We have to send again all strokes after a reset.
    delete recognizerContextReference.instanceId;
    NetworkWSInterface.send(recognizerContextReference.websocket, { type: 'reset' });
  }
  // We do not keep track of the success of reset.
  return Promise.resolve();
}


/**
 * Recognition context
 * @typedef {Object} RecognitionContext
 * @property {function(recognizerContext: RecognizerContext, model: Model, options: Options): Object} buildInputFunction
 * @property {function(model: Model, recognitionData: Object): Object} processResultFunction
 * @property {Model} model
 * @property {Options} options
 * @property {DestructuredPromise} recognitionPromiseCallbacks
 */

/**
 * Send a recognition message
 * @param {RecognizerContext} recognizerContext
 * @param {RecognitionContext} recognitionContext
 */
function send(recognizerContext, recognitionContext) {
  const recognizerContextReference = recognizerContext;

  logger.debug('Recognizer is alive. Sending strokes');
  recognizerContextReference.recognitionContexts.push(recognitionContext);
  NetworkWSInterface.send(recognizerContextReference.websocket, recognitionContext.buildInputFunction(recognizerContext, recognitionContext.model, recognitionContext.options));
  updateRecognitionPositions(recognizerContextReference, recognitionContext.model);
}

/**
 * @param {Options} options
 * @param {RecognizerContext} recognizerContext
 * @param {Model} model
 * @param {function(recognizerContext: RecognizerContext, model: Model, options: Options): Object} buildInputFunction
 * @param {function(model: Model, recognitionData: Object): Object} processResultFunction
 * @return {Promise}
 */
export function recognize(options, recognizerContext, model, buildInputFunction, processResultFunction) {
  const destructuredRecognitionPromise = PromiseHelper.destructurePromise();
  const recognizerContextReference = recognizerContext;

  // Building an object with all mandatory fields to feed the recognition queue.
  const recognitionContext = {
    buildInputFunction,
    processResultFunction,
    model,
    options,
    recognitionPromiseCallbacks: destructuredRecognitionPromise
  };

  recognizerContextReference.initPromise.then(() => {
    logger.debug('Init was done feeding the recognition queue');
    send(recognizerContextReference, recognitionContext);
  });

  return destructuredRecognitionPromise.promise;
}

/**
 * Close and free all resources that will no longer be used by the recognizer.
 * @param {Options} options
 * @param {Model} model
 * @param {RecognizerContext} recognizerContext
 * @return {Promise}
 */
export function close(options, model, recognizerContext) {
  if (recognizerContext && recognizerContext.websocket) {
    NetworkWSInterface.close(recognizerContext.websocket, 1000, 'CLOSE BY USER');
  }
}


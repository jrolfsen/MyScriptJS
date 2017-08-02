import { recognizerLogger as logger } from '../../../configuration/LoggerConfig';
import * as CryptoHelper from '../../CryptoHelper';
import Constants from '../../../configuration/Constants';
import * as InkModel from '../../../model/InkModel';
import * as RecognizerContext from '../../../model/RecognizerContext';
import * as StrokeComponent from '../../../model/StrokeComponent';
import * as Cdkv3WSWebsocketBuilder from './Cdkv3WSBuilder';
import * as CdkWSRecognizerUtil from '../CdkWSRecognizerUtil';
import * as DefaultRecognizer from '../../DefaultRecognizer';

export { close } from '../CdkWSRecognizerUtil';

/**
 * Recognizer configuration
 * @type {RecognizerInfo}
 */
export const mathWebSocketV3Configuration = {
  types: [Constants.RecognitionType.MATH],
  protocol: Constants.Protocol.WEBSOCKET,
  apiVersion: 'V3',
  availableTriggers: {
    exportContent: [Constants.Trigger.POINTER_UP]
  }
};

/**
 * Get the configuration supported by this recognizer
 * @return {RecognizerInfo}
 */
export function getInfo() {
  return mathWebSocketV3Configuration;
}

function buildHmacMessage(recognizerContext, message, configuration) {
  return {
    type: 'hmac',
    applicationKey: configuration.recognitionParams.server.applicationKey,
    challenge: message.data.challenge,
    hmac: CryptoHelper.computeHmac(message.data.challenge, configuration.recognitionParams.server.applicationKey, configuration.recognitionParams.server.hmacKey)
  };
}

function buildInitMessage(recognizerContext, model, configuration) {
  return {
    type: 'applicationKey',
    applicationKey: configuration.recognitionParams.server.applicationKey
  };
}

function buildMathInput(recognizerContext, model, configuration) {
  InkModel.updateModelSentPosition(model);
  if (recognizerContext.lastPositions.lastSentPosition < 0) {
    return {
      type: 'start',
      parameters: configuration.recognitionParams.v3.mathParameter,
      components: model.rawStrokes.map(stroke => StrokeComponent.toJSON(stroke))
    };
  }

  return {
    type: 'continue',
    components: InkModel.extractPendingStrokes(model, -1).map(stroke => StrokeComponent.toJSON(stroke))
  };
}

function buildResetMessage(recognizerContext, model, configuration) {
  InkModel.resetModelPositions(model);
  return {
    type: 'reset'
  };
}

/**
 * Initialize recognition
 * @param {Configuration} configuration Current configuration
 * @param {Model} model Current model
 * @param {RecognizerContext} recognizerContext Current recognizer context
 * @param {function(err: Object, res: Object, types: ...String)} callback
 */
export function init(configuration, model, recognizerContext, callback) {
  const initContext = {
    suffixUrl: '/api/v3.0/recognition/ws/math',
    buildWebSocketCallback: Cdkv3WSWebsocketBuilder.buildWebSocketCallback,
    buildInitMessage,
    buildHmacMessage,
    reconnect: init,
    model,
    configuration,
    callback
  };

  CdkWSRecognizerUtil.init(configuration, InkModel.resetModelPositions(model), recognizerContext, initContext)
    .then(res => callback(undefined, res, Constants.EventType.CHANGED))
    .catch((err) => {
      if (RecognizerContext.shouldAttemptImmediateReconnect(recognizerContext) && recognizerContext.reconnect) {
        logger.info('Attempting a reconnect', recognizerContext.currentReconnectionCount);
        recognizerContext.reconnect(configuration, model, recognizerContext, callback);
      } else {
        logger.error('Unable to init', err);
        callback(err, model);
      }
    });
}

/**
 * Export content
 * @param {Configuration} configuration Current configuration
 * @param {Model} model Current model
 * @param {RecognizerContext} recognizerContext Current recognizer context
 * @param {function(err: Object, res: Object, types: ...String)} callback
 */
export function exportContent(configuration, model, recognizerContext, callback) {
  CdkWSRecognizerUtil.sendMessages(configuration, model, recognizerContext, callback, buildMathInput);
}

/**
 * Reset the recognition context
 * @param {Configuration} configuration Current configuration
 * @param {Model} model Current model
 * @param {RecognizerContext} recognizerContext Current recognizer context
 * @param {function(err: Object, res: Object, types: ...String)} callback
 */
export function reset(configuration, model, recognizerContext, callback) {
  CdkWSRecognizerUtil.sendMessages(configuration, model, recognizerContext, callback, buildResetMessage);
}

/**
 * Clear server context. Currently nothing to do there.
 * @param {Configuration} configuration Current configuration
 * @param {Model} model Current model
 * @param {RecognizerContext} recognizerContext Current recognizer context
 * @param {function(err: Object, res: Object, types: ...String)} callback
 */
export function clear(configuration, model, recognizerContext, callback) {
  DefaultRecognizer.clear(configuration, model, recognizerContext, (err, res) => {
    reset(configuration, res, recognizerContext, (err1, res1) => logger.trace('Session reset'));
    callback(err, res);
  });
}

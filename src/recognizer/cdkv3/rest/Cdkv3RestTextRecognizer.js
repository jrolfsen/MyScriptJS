import { recognizerLogger as logger } from '../../../configuration/LoggerConfig';
import MyScriptJSConstants from '../../../configuration/MyScriptJSConstants';
import * as StrokeComponent from '../../../model/StrokeComponent';
import * as NetworkInterface from '../../networkHelper/rest/networkInterface';
import * as CryptoHelper from '../../CryptoHelper';
import { updateSentRecognitionPositions, resetRecognitionPositions } from '../../../model/RecognizerContext';
import { commonRestV3Configuration } from './Cdkv3CommonRestRecognizer'; // Configuring recognition trigger
import { processRenderingResult } from '../common/Cdkv3CommonTextRecognizer';

export { init, close } from '../../DefaultRecognizer';

/**
 * Recognizer configuration
 * @type {{type: String, protocol: String, apiVersion: String}}
 */
export const textRestV3Configuration = {
  type: MyScriptJSConstants.RecognitionType.TEXT,
  protocol: MyScriptJSConstants.Protocol.REST,
  apiVersion: 'V3'
};

/**
 * Get the configuration supported by this recognizer
 * @return {RecognizerInfo}
 */
export function getInfo() {
  return Object.assign({}, commonRestV3Configuration, textRestV3Configuration);
}

/**
 * Internal function to build the payload to ask for a recognition.
 * @param {Options} options
 * @param {Model} model
 * @param {String} instanceId
 * @return {Object}
 */
export function buildInput(options, model, instanceId) {
  const input = {
    inputUnits: [{
      textInputType: MyScriptJSConstants.InputType.MULTI_LINE_TEXT,
      // As Rest TEXT recognition is non incremental wa add the already recognized strokes
      components: model.rawStrokes.map(stroke => StrokeComponent.toJSON(stroke))
    }]
  };
  Object.assign(input, { textParameter: options.recognitionParams.textParameter }); // Building the input with the suitable parameters

  logger.debug(`input.inputUnits[0].components size is ${input.inputUnits[0].components.length}`);

  const data = {
    instanceId,
    applicationKey: options.recognitionParams.server.applicationKey,
    textInput: JSON.stringify(input)
  };

  if (options.recognitionParams.server.hmacKey) {
    data.hmac = CryptoHelper.computeHmac(data.textInput, options.recognitionParams.server.applicationKey, options.recognitionParams.server.hmacKey);
  }
  return data;
}

/**
 * Do the recognition
 * @param {Options} options Current configuration
 * @param {Model} model Current model
 * @param {RecognizerContext} recognizerContext Current recognizer context
 * @return {Promise.<Model>} Promise that return an updated model as a result
 */
export function recognize(options, model, recognizerContext) {
  const modelReference = model;
  const recognizerContextReference = recognizerContext;

  const data = buildInput(options, modelReference, recognizerContextReference.textInstanceId);
  updateSentRecognitionPositions(recognizerContextReference, modelReference);
  return NetworkInterface.post(`${options.recognitionParams.server.scheme}://${options.recognitionParams.server.host}/api/v3.0/recognition/rest/text/doSimpleRecognition.json`, data)
      .then(
          (response) => {
            logger.debug('Cdkv3RestTextRecognizer success', response);
            recognizerContextReference.textInstanceId = response.instanceId;
            logger.debug('Cdkv3RestTextRecognizer update model', response);
            modelReference.lastRecognitionPositions.lastReceivedPosition = modelReference.lastRecognitionPositions.lastSentPosition;
            modelReference.rawResult = response;
            return modelReference;
          }
      )
      .then(processRenderingResult);
}

/**
 * Do what is needed to clean the server context.
 * @param {Options} options Current configuration
 * @param {Model} model Current model
 * @param {RecognizerContext} recognizerContext Current recognizer context
 * @return {Promise}
 */
export function reset(options, model, recognizerContext) {
  resetRecognitionPositions(recognizerContext, model);
  // We are explicitly manipulating a reference here.
  // eslint-disable-next-line no-param-reassign
  delete recognizerContext.textInstanceId;
  return Promise.resolve();
}

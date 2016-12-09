import MyScriptJSConstants from '../../../configuration/MyScriptJSConstants';

/**
 * @return {{}}
 */
export function getAvailableRecognitionSlots() {
  const availableRecognitionTypes = {};
  availableRecognitionTypes[MyScriptJSConstants.RecognitionTrigger.QUIET_PERIOD] = true;
  availableRecognitionTypes[MyScriptJSConstants.RecognitionTrigger.DEMAND] = true;
  return availableRecognitionTypes;
}

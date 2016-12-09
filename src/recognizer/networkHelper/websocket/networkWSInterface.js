import { recognizerLogger as logger } from '../../../configuration/LoggerConfig';

/**
 * @private
 * @param {WebSocket} websocket
 * @param {number} code
 * @param {string} reason
 */
export function close(websocket, code, reason) {
  if (websocket && websocket.readyState < 2) {
    websocket.close(code, reason);
  }
}

/**
 * @private
 * @param {WebSocket} websocket
 * @param {Object} message
 */
export function send(websocket, message) {
  const state = websocket.readyState;
  if (state === 1) {
    websocket.send(JSON.stringify(message));
  }
}

/**
 * @private
 * @param {string} url
 * @param callback
 * @return {WebSocket}
 */
export function openWebSocket(url, callback) {
  // eslint-disable-next-line no-undef
  const socket = new WebSocket(url);

  socket.onopen = (e) => {
    logger.debug('onOpen');
    callback(e);
  };

  socket.onclose = (e) => {
    logger.debug('onClose');
    callback(e);
  };

  socket.onerror = (e) => {
    logger.debug('onError');
    callback(e);
  };

  socket.onmessage = (e) => {
    logger.debug('onMessage');
    const callBackParam = {
      type: e.type,
      data: JSON.parse(e.data)
    };
    callback(callBackParam);
  };

  return socket;
}

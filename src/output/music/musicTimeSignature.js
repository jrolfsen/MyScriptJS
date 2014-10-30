(function (scope) {

    /**
     *
     * @param {Object} obj
     * @constructor
     */
    function MusicTimeSignature (obj) {
        scope.AbstractMusicElement.call(this, obj);
        if (obj) {
            this.top = new scope.MusicAnnotation(obj.top);
            this.bottom = new scope.MusicAnnotation(obj.bottom);
            this.type = obj.type;
        }
    }

    /**
     *
     * @type {MyScript.AbstractMusicElement}
     */
    MusicTimeSignature.prototype = new scope.AbstractMusicElement();

    /**
     *
     * @type {MusicTimeSignature}
     */
    MusicTimeSignature.prototype.constructor = MusicTimeSignature;

    /**
     *
     * @returns {MusicAnnotation}
     */
    MusicTimeSignature.prototype.getTop = function () {
        return this.top;
    };

    /**
     *
     * @returns {MusicAnnotation}
     */
    MusicTimeSignature.prototype.getBottom = function () {
        return this.bottom;
    };

    /**
     *
     * @returns {string}
     */
    MusicTimeSignature.prototype.getType = function () {
        return this.type;
    };

    // Export
    scope.MusicTimeSignature = MusicTimeSignature;
})(MyScript);
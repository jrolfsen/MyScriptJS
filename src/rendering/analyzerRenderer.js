(function (scope) {

    /**
     * Represent the Analyzer Renderer. It's use to calculate the analyzer ink rendering in HTML5 canvas
     *
     * @class AnalyzerRenderer
     * @constructor
     */
    function AnalyzerRenderer () {
    }

    /**
     * Inheritance property
     */
    AnalyzerRenderer.prototype = new scope.AbstractRenderer();

    /**
     * Constructor property
     */
    AnalyzerRenderer.prototype.constructor = AnalyzerRenderer;

    /**
     * Draw table
     *
     * @method tableStrokesDrawing
     * @param {Object} strokes
     * @param {Object} parameters
     * @param {Object} tables
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.tableStrokesDrawing = function (strokes, parameters, tables, context) {
        for (var i in tables) {
            if (tables[i].data) {

                if (this.showBoundingBoxes) {
                    for (var j in tables[i].getCells()) {
                        this.drawCell(tables[i].getCells()[j], parameters, context);
                    }
                }
                for (var z in tables[i].getLines()) {
                    this.drawLine(tables[i].getLines()[z], parameters, context);
                }
            }
        }
    };

    /**
     * Draw the text line
     *
     * @method textLineStrokesDrawing
     * @param {Object} strokes
     * @param {Object} parameters
     * @param {Object} textLines
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.textLineStrokesDrawing = function (strokes, parameters, textLines, context) {

        for (var i in textLines) {
            var textLine = textLines[i];
            var data = textLine.getData();
            if (data) {

                if (this.showBoundingBoxes) {
                    this.drawRectangle(data.getTopLeftPoint().x, data.getTopLeftPoint().y, data.getWidth(), data.getHeight(), parameters, context);
                }

                var selectedCandidateidx = textLine.result.textSegmentResult.selectedCandidateIdx;
                var text = textLine.result.textSegmentResult.candidates[selectedCandidateidx].label;
                var textHeight = data.getTextHeight();

                var topLeft = this.drawText(data.getTopLeftPoint().getX(), data.getTopLeftPoint().getY(), data.getWidth(), data.getHeight(), text, data.getJustificationType(), data.getTextHeight(), data.getBaselinePos(), parameters, context);

                var lowerBaselinePos = data.getBaselinePos() + textHeight / 10;

                var underlines = textLine.getUnderlineList();

                for (var j in underlines) {
                    var firstCharacter = underlines[j].getData().getFirstCharacter();
                    var lastCharacter = underlines[j].getData().getLastCharacter();

                    var textMetrics = context.measureText(text);

                    textMetrics = context.measureText(text.substring(0, firstCharacter));
                    var x1 = topLeft.x + textMetrics.width;

                    textMetrics = context.measureText(text.substring(firstCharacter, lastCharacter + 1));
                    var x2 = x1 + textMetrics.width;
                    this.drawLine({
                        x: x1,
                        y: lowerBaselinePos
                    }, {
                        x: x2,
                        y: lowerBaselinePos
                    }, parameters, context);
                }
            }
        }
    };

    /**
     * Draw a line
     *
     * @method drawLine
     * @param {Object} line
     * @param {Object} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawLine = function (line, parameters, context) {
        if (line.data === null) {
            this.drawLine(line.getData().getP1(), line.getData().getP2(), parameters, context);
        }
    };

    /**
     * Draw a cell
     *
     * @method drawCell
     * @param {Object} cell
     * @param {Object} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawCell = function (cell, parameters, context) {
        if (cell.data === null) {
            this.drawRectangle(cell.getData().getTopLeftPoint().getX(), cell.getData().getTopLeftPoint().getY(), cell.getData().getWidth(), cell.getData().getHeight(), parameters, context);
        }
    };

    // Export
    scope.AnalyzerRenderer = AnalyzerRenderer;
})(MyScript);
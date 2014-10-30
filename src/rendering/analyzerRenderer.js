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
     * Draw shape strokes on HTML5 canvas
     *
     * @method drawStrokesByRecognitionResult
     * @param {Array} strokes
     * @param {AnalyzerDocument} recognitionResult
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawStrokesByRecognitionResult = function (strokes, recognitionResult, parameters, context) {
        this.drawShapes(strokes, recognitionResult.getShapes(), parameters, context);
        this.drawTables(strokes, recognitionResult.getTables(), parameters, context);
        this.drawTextLines(strokes, recognitionResult.getTextLines(), parameters, context);
        this.drawGroups(strokes, recognitionResult.getGroups(), parameters, context);
    };

    /**
     * Draw text on analyser
     *
     * @method drawText
     * @param {Number} x
     * @param {Number} y
     * @param {Number} width
     * @param {Number} height
     * @param {Object} text
     * @param {Object} justificationType
     * @param {Object} textHeight
     * @param {Object} baseline
     * @param {RenderingParameters} parameters
     * @param {Object} context
     * @returns {{x: *, y: *}}
     */
    AnalyzerRenderer.prototype.drawText = function (x, y, width, height, text, justificationType, textHeight, baseline, parameters, context) {

        var topLeft = {
                x: x,
                y: y
            },
            textMetrics;

        // If Text height is taller than Bounding box height
        if (textHeight > height) {
            textHeight = height;
        }

        context.font = parameters.getDecoration() + textHeight + 'pt ' + parameters.font;

        textMetrics = context.measureText(text);

        // If Text width is wider than Bounding box width
        if (textMetrics.width > width) {
            textHeight = textHeight * width / textMetrics.width;
            context.font = parameters.getDecoration() + textHeight + 'pt ' + parameters.font;
        } else {
            // If Text is analyzed as centered
            if ('CENTER' === justificationType) {
                topLeft.x = x + (width - textMetrics.width) / 2;
            }
        }

        context.save();
        try {
            context.fillStyle = parameters.getColor();
            context.strokeStyle = parameters.getColor();
            context.globalAlpha = parameters.getAlpha();
            context.lineWidth = 0.5 * parameters.getWidth();

            context.font = parameters.getDecoration() + textHeight + 'pt ' + parameters.font;

            context.fillText(text, topLeft.x, baseline);

        } finally {
            context.restore();
        }
        return topLeft;
    };

    /**
     * Draw table
     *
     * @method drawTables
     * @param {Array} strokes
     * @param {Array} tables
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawTables = function (strokes, tables, parameters, context) {
        for (var i in tables) {
            if (parameters.getShowBoundingBoxes()) {
                for (var j in tables[i].getCells()) {
                    this.drawCell(tables[i].getCells()[j], parameters, context);
                }
            }
            for (var k in tables[i].getLines()) {
                this.drawLine(tables[i].getLines()[k], parameters, context);
            }
        }
    };

    /**
     * Draw the text line
     *
     * @method drawTextLines
     * @param {Array} strokes
     * @param {Array} textLines
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawTextLines = function (strokes, textLines, parameters, context) {

        for (var i in textLines) {
            var textLine = textLines[i];
            var data = textLine.getData();
            if (data) {

                if (parameters.getShowBoundingBoxes()) {
                    this.drawRectangle(data.getBoundingBox(), parameters, context);
                }

                var text = textLine.getTextDocument().getTextSegmentResult().getSelectedCandidate().getLabel();
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
     * Draw Groups
     *
     * @method drawGroups
     * @param {Array} strokes
     * @param {Array} groups
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawGroups = function (strokes, groups, parameters, context) {
        throw new Error('not implemented');
    };

    /**
     * Draw a line
     *
     * @method drawLine
     * @param {AnalyzerLine} line
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawLine = function (line, parameters, context) {
        if (line.getData()) {
            this.drawLineByPoints(line.getData().getP1(), line.getData().getP2(), parameters, context);
        }
    };

    /**
     * Draw a cell
     *
     * @method drawCell
     * @param {AnalyzerCell} cell
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawCell = function (cell, parameters, context) {
        if (cell.getData()) {
            this.drawRectangle(cell.getData().getBoundingBox(), parameters, context);
        }
    };

    /**
     * Draw the shapes
     *
     * @method drawShapes
     * @param {Array} strokes
     * @param {Array} shapes
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawShapes = function (strokes, shapes, parameters, context) {

        for (var i in shapes) {
            var segment = shapes[i];
            var candidate = segment.getSelectedCandidate();

            if (candidate) {
                if (candidate instanceof scope.ShapeRecognized) {
                    this.drawShapeRecognized(candidate, parameters, context);
                } else if (candidate instanceof scope.ShapeNotRecognized) {
                    this.drawShapeNotRecognized(strokes, segment.getInkRanges(), candidate, parameters, context);
                } else {
                    throw new Error('not implemented');
                }
            }
        }
    };

    /**
     * This method allow you to draw recognized shape
     *
     * @method drawShapeRecognized
     * @param {ShapeRecognized} shapeRecognized
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawShapeRecognized = function (shapeRecognized, parameters, context) {

        var primitives = shapeRecognized.getPrimitives();

        for (var i in primitives) {
            this.drawShapePrimitive(primitives[i], parameters, context);
        }
        if (parameters.getShowBoundingBoxes()) {
            var rectangleList = [];

            for (var j in primitives) {
                // Primitive bounding rect
                rectangleList.push(this.getPrimitiveBoundingBox(primitives[j]));
            }
            // Bounding rect of the entire shape
            var boundingRect = scope.MathUtils.getBoundingRect(rectangleList);
            this.drawRectangle(boundingRect, parameters, context);
        }
    };

    /**
     * This method allow you to draw not recognized shape
     *
     * @method drawShapeNotRecognized
     * @param {Array} strokes
     * @param {Array} inkRanges
     * @param {ShapeNotRecognized} shapeNotRecognized
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawShapeNotRecognized = function (strokes, inkRanges, shapeNotRecognized, parameters, context) {
        for (var i in inkRanges) {
            var extractedStrokes = this.extractStroke(strokes, inkRanges[i]);
            this.drawStrokes(extractedStrokes, parameters, context);
        }

    };

    /**
     * Draw shape primitive
     *
     * @method drawShapePrimitive
     * @param {AbstractShapePrimitive} primitive
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawShapePrimitive = function (primitive, parameters, context) {
        if (primitive instanceof scope.ShapeEllipse) {
            this.drawShapeEllipse(primitive, parameters, context);
        } else if (primitive instanceof scope.ShapeLine) {
            this.drawShapeLine(primitive, parameters, context);
        }
    };

    /**
     * Draw shape line
     *
     * @method drawShapeLine
     * @param {ShapeLine} shapeLine
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawShapeLine = function (shapeLine, parameters, context) {

        this.drawLineByPoints(shapeLine.getFirstPoint(), shapeLine.getLastPoint(), parameters, context);

        if (shapeLine.hasBeginDecoration() && shapeLine.getBeginDecoration() === 'ARROW_HEAD') {
            this.drawArrowHead(shapeLine.getFirstPoint(), shapeLine.getBeginTangentAngle(), 12.0, parameters, context);
        }

        if (shapeLine.hasEndDecoration() && shapeLine.getEndDecoration() === 'ARROW_HEAD') {
            this.drawArrowHead(shapeLine.getLastPoint(), shapeLine.getEndTangentAngle(), 12.0, parameters, context);
        }
    };

    /**
     * Draw an ellipse arc on context
     *
     * @method drawEllipseArc
     * @param {ShapePoint} centerPoint
     * @param {number} maxRadius
     * @param {number} minRadius
     * @param {string} orientation
     * @param {number} startAngle
     * @param {number} sweepAngle
     * @param {RenderingParameters} parameters
     * @param {Object} context
     * @returns {Array}
     */
    AnalyzerRenderer.prototype.drawEllipseArc = function (centerPoint, maxRadius, minRadius, orientation, startAngle, sweepAngle, parameters, context) {

        var angleStep = 0.02; // angle delta between interpolated

        var z1 = Math.cos(orientation);
        var z3 = Math.sin(orientation);
        var z2 = z1;
        var z4 = z3;
        z1 *= maxRadius;
        z2 *= minRadius;
        z3 *= maxRadius;
        z4 *= minRadius;

        var n = Math.floor(Math.abs(sweepAngle) / angleStep);

        var boundariesPoints = [];

        context.save();
        try {
            context.fillStyle = parameters.getColor();
            context.strokeStyle = parameters.getColor();
            context.globalAlpha = parameters.getAlpha();
            context.lineWidth = 0.5 * parameters.getWidth();

            context.beginPath();

            for (var i = 0; i <= n; i++) {

                var angle = startAngle + (i / n) * sweepAngle; // points on the arc, in radian
                var alpha = Math.atan2(Math.sin(angle) / minRadius, Math.cos(angle) / maxRadius);

                var cosAlpha = Math.cos(alpha);
                var sinAlpha = Math.sin(alpha);

                // current point
                var x = centerPoint.x + z1 * cosAlpha - z4 * sinAlpha;
                var y = centerPoint.y + z2 * sinAlpha + z3 * cosAlpha;
                if (i === 0) {
                    context.moveTo(x, y);
                } else {
                    context.lineTo(x, y);
                }

                if (i === 0 || i === n) {
                    boundariesPoints.push({x: x, y: y});
                }
            }

            context.stroke();

        } finally {
            context.restore();
        }

        return boundariesPoints;
    };

    /**
     * Draw shape ellipse
     *
     * @method drawShapeEllipse
     * @param {ShapeEllipse} shapeEllipse
     * @param {RenderingParameters} parameters
     * @param {Object} context
     */
    AnalyzerRenderer.prototype.drawShapeEllipse = function (shapeEllipse, parameters, context) {

        var points = this.drawEllipseArc(
            shapeEllipse.getCenter(),
            shapeEllipse.getMaxRadius(),
            shapeEllipse.getMinRadius(),
            shapeEllipse.getOrientation(),
            shapeEllipse.getStartAngle(),
            shapeEllipse.getSweepAngle(),
            parameters, context);

        if (shapeEllipse.hasBeginDecoration() && shapeEllipse.getBeginDecoration() === 'ARROW_HEAD') {
            this.drawArrowHead(points[0], shapeEllipse.getBeginTangentAngle(), 12.0, parameters, context);
        }

        if (shapeEllipse.hasEndDecoration() && shapeEllipse.getEndDecoration() === 'ARROW_HEAD') {
            this.drawArrowHead(points[1], shapeEllipse.getEndTangentAngle(), 12.0, parameters, context);
        }
    };

    /**
     * Get the bounding box of primitive
     *
     * @method getPrimitiveBoundingBox
     * @param {AbstractShapePrimitive} primitive
     * @returns {Object} the bounding box
     */
    AnalyzerRenderer.prototype.getPrimitiveBoundingBox = function (primitive) {
        var rectangle = null;
        if (primitive instanceof scope.ShapeEllipse) {
            rectangle = scope.MathUtils.getEllipseArcRect(primitive.getCenter(), primitive.getMaxRadius(), primitive.getMinRadius(), primitive.getOrientation(), primitive.getStartAngle(), primitive.getSweepAngle());
        } else if (primitive instanceof scope.ShapeLine) {
            rectangle = scope.MathUtils.getLineRect(primitive.getFirstPoint(), primitive.getLastPoint());
        }
        return rectangle;
    };

    // Export
    scope.AnalyzerRenderer = AnalyzerRenderer;
})(MyScript);
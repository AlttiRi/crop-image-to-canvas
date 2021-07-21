export class Crop {
    /**
     * @param config
     * @param {HTMLImageElement} config.image
     * @param {HTMLCanvasElement} config.canvas
     */
    constructor({image, canvas}) {
        this.image = image;
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.wCanvas = canvas.width;
        this.hCanvas = canvas.height;

        this.wOffset = 0;
        this.hOffset = 0;
        this.zoomCanvasDiffPx = 0;

        const init = () => {
            this.wImage = this.image.naturalWidth;
            this.hImage = this.image.naturalHeight;
            this._fitImage();
            this.draw();
        }

        if (!image.complete) {
            image.addEventListener("load", init, {once: true});
        } else {
            init();
        }
    }

    _redrawQueued = false;

    /** @private */
    draw() {
        if (this._redrawQueued) {
            return;
        }
        this._redrawQueued = true;
        window.requestAnimationFrame(() => {
            this._draw();
            this._redrawQueued = false;
        });
    }
    state = null;
    _draw() {
        const {
            image, context,
            wCanvas, hCanvas,
            zoom,
            wOffset, hOffset,
            wImage, hImage
        } = this;

        let destX = wOffset;
        let destY = hOffset;
        const destWidth = wCanvas*zoom;
        const destHeight = wCanvas*zoom*(hImage/wImage);

        if (!this.state) {
            this.state = {destX,destY,destWidth,destHeight};
        }
        console.log({destX,destY,destWidth,destHeight});

        // zoom to the image center
        // this.wOffset = dx += (-dw + this.info.dw)/2;
        // this.hOffset = dy += (-dh + this.info.dh)/2;
        // else

        const k = (hImage/wImage)*(wCanvas/hCanvas);
        const centerOffsetX = ((destWidth/2 + destX)/wCanvas *2 -1)/zoom;
        const centerOffsetY = ((destHeight/2 + destY)/hCanvas*2 -1)/zoom/k;
        console.log({centerOffsetX, centerOffsetY});
        /* [Note]
            Case (X, Y):
              ( 0,  0) - the image's center
              ( 1,  1) - the image's upper left corner
              (-1,  1) - the image's upper right corner
              ( 1, -1) - the image's bottom left corner
              (-1, -1) - the image's bottom right corner
            ...is in canvas' center.
         */

        const {
             destWidth: oldDestWidth,   destX: oldDestX,  zoom: oldZoom,
            destHeight: oldDestHeight,  destY: oldDestY,
        } = this.state;

        const destWidthChanged = oldDestWidth !== destWidth; // do only on zoom, not on move
        if (destWidthChanged) {
            destX = 1/2*wCanvas*zoom*((oldDestWidth/wCanvas  + 2*oldDestX/wCanvas - 1)/oldZoom + (1 - destWidth/wCanvas)/zoom);
            this.wOffset = destX;

            destY = 1/2*hCanvas*zoom*((oldDestHeight/hCanvas + 2*oldDestY/hCanvas - 1)/oldZoom + (1 - destHeight/hCanvas)/zoom);
            this.hOffset = destY;
        }

        context.clearRect(0, 0, wCanvas, hCanvas);
        context.drawImage(image,
            0, 0,
            wImage, hImage,
            destX, destY,
            destWidth, destHeight,
        );

        this.state = {
            destX, destY,
            destWidth, destHeight,
            zoom,
            centerOffsetX, centerOffsetY
        };
    }

    _fitImage() {
        const {wImage, hImage, wCanvas, hCanvas} = this;
        const k = wCanvas/hCanvas; /* to apply H based changes to W axis */
        if (wImage/hImage > wCanvas/hCanvas) { /* if the image is wider that the crop */
            this.zoomCanvasDiffPx = -(hCanvas - wCanvas/(wImage/hImage))*k;
        }
        this.wOffset = +wCanvas/2 -wCanvas*this.zoom/2;
    }

    get zoom() {
       return this.wCanvas/(this.wCanvas + this.zoomCanvasDiffPx);
    }
    moveX(px) {
        this.wOffset -= px;
        this.draw();
    }
    moveY(px) {
        this.hOffset += px;
        this.draw();
    }

    /**
     * zoom by pixels by canvas width
     * @param {number} count
     */
    zoomByPx(count) {
        if (count < 0 && this.zoomCanvasDiffPx + count <= -this.wCanvas) {
            return;
        }
        this.zoomCanvasDiffPx += count;
        this.draw();
    }
    /**
     * @param {number} count
     */
    zoomByStep(count) {
        const step = this.wCanvas*0.05;
        const steps = Math.round(this.zoomCanvasDiffPx / step);
        this.zoomCanvasDiffPx = step * (steps + count);
        if (this.zoomCanvasDiffPx <= -this.wCanvas) {
            this.zoomCanvasDiffPx = -this.wCanvas + 1;
        }
        this.draw();
    }

    /**
     * Move the canvas by
     * @param {number} dx
     * @param {number} dy
     */
    offset({dx, dy}) {
        this.hOffset += dy;
        this.wOffset += dx;
        this.draw();
    }
}

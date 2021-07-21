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

        this.destX = 0;
        this.destY = 0;
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
    _preState = null;
    _draw() {
        const {
            // const
            image, context,
            wCanvas, hCanvas,
            wImage, hImage,

            // variable
            destX, destY,

            // computed
            zoom,
            destWidth, destHeight
        } = this;

        console.log(this.getCenterOffsets());

        context.clearRect(0, 0, wCanvas, hCanvas);
        context.drawImage(image,
            0, 0,
            wImage, hImage,
            destX, destY,
            destWidth, destHeight,
        );

        this._preState = {
            destX, destY,
            destWidth, destHeight,
            zoom
        };
    }

    /**
     * Note: `_afterZoom()` is based on that formulas
     * @return {{centerOffsetY: number, centerOffsetX: number}}
     */
    getCenterOffsets() {
        const {
            // const
            wCanvas, hCanvas,
            wImage, hImage,

            // variable
            destX, destY,

            // computed
            zoom,
            destWidth, destHeight
        } = this;

        const k = (hImage/wImage)*(wCanvas/hCanvas);
        const centerOffsetX =  ((destWidth/2 + destX)/wCanvas*2 - 1)/zoom;
        const centerOffsetY = ((destHeight/2 + destY)/hCanvas*2 - 1)/zoom/k;
        return {centerOffsetX, centerOffsetY};
    }

    /** Fixes offsets
     *  @private  */
    _afterZoom() {
        const {
            // const
            wCanvas, hCanvas,

            // computed
            zoom,
            destWidth, destHeight
        } = this;

        const zoomFromImageCenter = () => {
            const {
                destWidth: oldDestWidth,    zoom: oldZoom,
                destHeight: oldDestHeight,
            } = this._preState;
            if (oldZoom !== zoom) {
                this.destX += (oldDestWidth - destWidth) / 2;
                this.destY += (oldDestHeight - destHeight) / 2;
            }
        }
        const zoomToCanvasCenter = () => {
            const {
                destWidth: oldDestWidth,    destX: oldDestX,  zoom: oldZoom,
                destHeight: oldDestHeight,  destY: oldDestY,
            } = this._preState;

            if (oldZoom !== zoom) {
                this.destX = 1/2*wCanvas*zoom*((oldDestWidth/wCanvas  + 2*oldDestX/wCanvas - 1)/oldZoom + (1 -  destWidth/wCanvas)/zoom);
                this.destY = 1/2*hCanvas*zoom*((oldDestHeight/hCanvas + 2*oldDestY/hCanvas - 1)/oldZoom + (1 - destHeight/hCanvas)/zoom);
            }
        }

        zoomToCanvasCenter();
    }

    _fitImage() {
        const {wImage, hImage, wCanvas, hCanvas} = this;
        const k = wCanvas/hCanvas; /* to apply H based changes to W axis */
        if (wImage/hImage > wCanvas/hCanvas) { /* if the image is wider that the crop */
            this.zoomCanvasDiffPx = -(hCanvas - wCanvas/(wImage/hImage))*k;
        }
        this.destX = wCanvas/2 - wCanvas*this.zoom/2;
        this.destY = hCanvas/2 - wCanvas*this.zoom/2*(hImage/wImage);

        this._preState = {
            destX: this.destX,   destWidth: this.destWidth,   zoom: this.zoom,
            destY: this.destY,  destHeight: this.destHeight,
        };
    }

    get destWidth() {
        return this.wCanvas*this.zoom;
    }
    get destHeight() {
        return this.wCanvas*this.zoom*(this.hImage/this.wImage);
    }
    get zoom() {
       return this.wCanvas/(this.wCanvas + this.zoomCanvasDiffPx);
    }
    moveX(px) {
        this.destX -= px;
        this.draw();
    }
    moveY(px) {
        this.destY += px;
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
        this._afterZoom();
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
        this._afterZoom();
        this.draw();
    }

    /**
     * Move the canvas by
     * @param {number} dx
     * @param {number} dy
     */
    offset({dx, dy}) {
        this.destX += dx;
        this.destY += dy;
        this.draw();
    }
}

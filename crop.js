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
            Object.assign(this, this._computeProps());
            this.draw();
        }

        if (!image.complete) { // image.naturalWidth === 0
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
    _draw() {
        const {
            image, context,
            wCanvas, hCanvas,
            zoom,
            wOffset, hOffset,
            k,
            wSource, hSource,
            wBaseOffset, hBaseOffset
        } = this;

        context.clearRect(0, 0, wCanvas, hCanvas);
        context.drawImage(image,
            wBaseOffset + (wSource - wSource*zoom)/2 + wOffset*k*zoom,
            hBaseOffset + (hSource - hSource*zoom)/2 + hOffset*k*zoom,
            wSource*zoom, hSource*zoom,
            0, 0,
            wCanvas, hCanvas,
        );
    }

    /**
     * @return {{
     *   k: number,
     *   wSource: number,
     *   hSource: number,
     *   wBaseOffset: number,
     *   hBaseOffset: number,
     * }}
     * @private
     */
    _computeProps() {
        const {wImage, hImage, wCanvas, hCanvas} = this;
        const canvasAspectRatio = wCanvas / hCanvas;
        if (wImage > hImage) {
            // if landscape
            const wSource = hImage * canvasAspectRatio;
            const hSource = hImage;
            const wBaseOffset = (wImage - wSource) / 2;
            const hBaseOffset = 0;
            const k1 = hImage / hCanvas;
            const k2 = hImage / hSource;
            return {k: k1*k2, wSource, hSource, wBaseOffset, hBaseOffset};
        } else {
            // if portrait
            const wSource = wImage;
            const hSource = wImage / canvasAspectRatio;
            const wBaseOffset = 0;
            const hBaseOffset = (hImage - hSource) / 2;
            const k1 = wImage / wCanvas;
            const k2 = wImage / wSource;
            return {k: k1*k2, wSource, hSource, wBaseOffset, hBaseOffset};
        }
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

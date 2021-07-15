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
    _draw() {
        const {
            image, context,
            wCanvas, hCanvas,
            zoom,
            wOffset, hOffset,
            wImage, hImage
        } = this;

        context.clearRect(0, 0, wCanvas, hCanvas);
        context.drawImage(image,
            0, 0,
            wImage, hImage,
            wCanvas/2 + wOffset - wCanvas*zoom/2 + this.ww,
            hCanvas/2 + hOffset - wCanvas*zoom/2*(hImage/wImage) + this.hh,
            wCanvas*zoom,
            wCanvas*zoom*(hImage/wImage),
        );
    }
    _fitImage() {
        const {wImage, hImage, wCanvas, hCanvas} = this;
        const k = wCanvas/hCanvas; /* to apply H based changes to W axis */
        if (wImage/hImage > wCanvas/hCanvas) { /* if the image is wider that the crop */
            this.zoomCanvasDiffPx = -(hCanvas - wCanvas/(wImage/hImage))*k;
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


        const {
            image, context,
            wCanvas, hCanvas,
            zoom,
            wOffset, hOffset,
            wImage, hImage,
            ww,hh
        } = this;



        const step = this.wCanvas*0.05;
        const steps = Math.round(this.zoomCanvasDiffPx / step);
        this.zoomCanvasDiffPx = step * (steps + count);
        if (this.zoomCanvasDiffPx <= -this.wCanvas) {
            this.zoomCanvasDiffPx = -this.wCanvas + 1;
        }



        const z = this.zoom - zoom;
        const d = (wOffset )*z
        const h = (hOffset )*z

        this.ww += d;
        this.hh += h;

        console.log({z, d, h});



        this.draw();
    }

    ww = 0;
    hh = 0;

    /**
     * Move the canvas by
     * @param {number} dx
     * @param {number} dy
     */
    offset({dx, dy}) {

        if (this.ww || this.hh) {
            this.hOffset += this.hh;
            this.wOffset += this.ww;
            this.hh = 0;
            this.ww = 0;
            console.log("---");
        }

        this.hOffset += dy;
        this.wOffset += dx;
        this.draw();
    }
}

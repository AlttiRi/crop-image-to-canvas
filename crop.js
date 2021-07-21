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

        let dx =  +wOffset;
        let dy =  +hOffset;
        const dw = wCanvas*zoom;
        const dh = wCanvas*zoom*(hImage/wImage);

        if (!this.state) {
            this.state = {dx,dy,dw,dh};
        }
        console.log({dx,dy,dw,dh});

        // zoom to the image center
        // this.wOffset = dx += (-dw + this.info.dw)/2;
        // this.hOffset = dy += (-dh + this.info.dh)/2;
        // else

        const k = (hImage/wImage)*(wCanvas/hCanvas);
        const centerOffsetX = ((dw/2 + dx)/wCanvas *2 -1)/zoom;
        const centerOffsetY = ((dh/2 + dy)/hCanvas*2 -1)/zoom/k;
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
            dw: oldDw, dh: oldDh, dx: oldDx, dy: oldDy, zoom: oldZoom,
            centerOffsetX: oldCenterOffsetX
        } = this.state;

        const destWidthChanged = (oldDw !== dw); // do only on zoom, not on move
        // const widthCenterChanged = (oldCenterOffsetX !== undefined) && (oldCenterOffsetX !== centerOffsetX);
        if (destWidthChanged/* && widthCenterChanged*/) {
            console.log("suka");

            let xxx = (oldDw/wCanvas/oldZoom    + oldDx/wCanvas *2/oldZoom   -1/oldZoom   - dw/wCanvas/zoom    + 1/zoom)/2*zoom*wCanvas      - dx;
            this.wOffset = dx += xxx;

            let yyy = (oldDh/hCanvas/oldZoom/k + oldDy/hCanvas*2/oldZoom/k -1/oldZoom/k - dh/hCanvas/zoom/k + 1/zoom/k)/2*zoom*k*hCanvas - dy;
            this.hOffset = dy += yyy;
        }

        context.clearRect(0, 0, wCanvas, hCanvas);
        context.drawImage(image,
            0, 0,
            wImage, hImage,
            dx, dy,
            dw, dh,
        );

        this.state = {dx,dy,dw,dh,zoom,centerOffsetX,centerOffsetY};
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

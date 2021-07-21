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
    info = null;
    _draw() {
        const {
            image, context,
            wCanvas, hCanvas,
            zoom,
            wOffset, hOffset,
            wImage, hImage
        } = this;

        let dx =  +wOffset// +wCanvas/2 //-wCanvas*zoom/2
        let dy =  +hOffset// +hCanvas/2 //-wCanvas*zoom/2*(hImage/wImage)
        let dw = wCanvas*zoom;
        let dh = wCanvas*zoom*(hImage/wImage);

        if (!this.info) {
            this.info = {dx,dy,dw,dh};
        }
        console.log({dx,dy,dw,dh});

        // center
        this.wOffset = dx += (-dw + this.info.dw)/2
        this.hOffset = dy += (-dh + this.info.dh)/2


        const width = this.canvas.width;
        const wp = ((dw/2 + dx)/width *2 -1)/zoom;
        const hp = ((dh/2 + dy)/this.canvas.height*2 -1)/zoom/(hImage/wImage)/(this.canvas.width/this.canvas.height);
        console.log({wp, hp});

        const oldWp = this.wp;
        if (this.wp !== undefined && oldWp !== wp && this.info.dw !== dw) {
            console.log("----");


            // const __wp = dw/width/zoom + dx/width*2/zoom -1/zoom ;

            // old_dw/width/old_zoom + old_dx/width*2/old_zoom -1/old_zoom
            // ===
            // dw/width/zoom + (dx + XXX)/width*2/zoom -1/zoom

            // (dx + XXX)/width*2/zoom === old_dw/width/old_zoom + old_dx/width*2/old_zoom -1/old_zoom - dw/width/zoom + 1/zoom


            let xxx;
            xxx = (this.info.dw/width/this.info.zoom + this.info.dx/width*2/this.info.zoom -1/this.info.zoom - dw/width/zoom + 1/zoom)/2*zoom*width - dx;

            this.wOffset = dx += xxx;

        }



        Object.assign(this, {wp, hp});

        context.clearRect(0, 0, wCanvas, hCanvas);
        context.drawImage(image,
            0, 0,
            wImage, hImage,
            dx, dy,
            dw, dh,
        );

        this.info = {dx,dy,dw,dh,zoom};
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

export function enableCropDefaultControls({crop, canvas, changeCursor}) {
    document.body.addEventListener("keydown", event => {
        if (event.code === "ArrowLeft") {
            event.preventDefault();
            crop.moveX(1);
        } else if (event.code === "ArrowRight") {
            event.preventDefault();
            crop.moveX(-1);
        } else if (event.code === "ArrowUp") {
            event.preventDefault();
            crop.moveY(-1);
        } else if (event.code === "ArrowDown") {
            event.preventDefault();
            crop.moveY(1);
        } else if (event.code === "ShiftRight") {
            event.preventDefault();
            crop.zoomByPx(-1);
        } else if (event.code === "ControlRight") {
            event.preventDefault();
            crop.zoomByPx(1);
        }
    });
    canvas.addEventListener("wheel", event => {
        event.preventDefault();
        if (event.deltaY < 0) {
            crop.zoomByStep(-1);
            // console.log("^");
        } else {
            crop.zoomByStep(1);
            // console.log("v");
        }
    }, {passive: false});


    let state;
    let isPressed = false;
    canvas.addEventListener("pointerdown", event => {
        if (event.button !== 0) {
            return;
        }
        isPressed = true;
        document.body.style.userSelect = "none";
        if (changeCursor) {
            document.body.style.cursor = "move";
        }
        state = {x: event.clientX, y: event.clientY};
    });
    document.addEventListener("pointerup", event => {
        isPressed = false;
        document.body.style.userSelect = "auto";
        if (changeCursor) {
            document.body.style.cursor = "auto";
        }
        state = null;
    });
    document.addEventListener("pointermove", event => {
        if (!isPressed) {
            return;
        }
        const {clientX: x, clientY: y} = event;
        crop.offset({
            dx: -state.x + x,
            dy: -state.y + y
        });
        state = {x, y};
    });
}
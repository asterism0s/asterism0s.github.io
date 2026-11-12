const blobField = document.querySelector(".blob-field");
const root = document.documentElement;
const interactiveSelector = "a, button, input, textarea, select, label";
const blobLines = document.querySelectorAll("[data-blob-line]");
const lineColor = "var(--line-color)";
const lineFade = 24;

let drag = null;
let hoverFrame = null;

function centerOf(element) {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function pieceAt(x, y) {
    const pieces = [...blobField.querySelectorAll(".blob-field__piece")].reverse();

    return pieces.find((piece) => {
        const rect = piece.getBoundingClientRect();
        const radius = rect.width / 2;
        return Math.hypot(x - (rect.left + radius), y - (rect.top + radius)) <= radius;
    });
}

function canGrab(event) {
    return event.pointerType !== "touch" && !event.target.closest(interactiveSelector);
}

function followPointer() {
    if (!drag) return;

    const blobCenter = centerOf(drag.blob);
    const x = drag.pointerX - drag.grabX - blobCenter.x;
    const y = drag.pointerY - drag.grabY - blobCenter.y;

    drag.piece.style.translate = `${x}px ${y}px`;
    requestAnimationFrame(followPointer);
}

function startDrag(event) {
    if (event.button !== 0 || !canGrab(event)) return;

    const piece = pieceAt(event.clientX, event.clientY);
    if (!piece) return;

    event.preventDefault();

    const pieceCenter = centerOf(piece);

    drag = {
        piece,
        blob: piece.parentElement,
        grabX: event.clientX - pieceCenter.x,
        grabY: event.clientY - pieceCenter.y,
        pointerX: event.clientX,
        pointerY: event.clientY,
    };

    piece.style.transition = "none";
    piece.style.animation = "none";
    root.dataset.blobDrag = "";
    delete root.dataset.blobHover;

    followPointer();
}

function moveDrag(event) {
    if (drag) {
        drag.pointerX = event.clientX;
        drag.pointerY = event.clientY;
        return;
    }

    if (!canGrab(event) || hoverFrame) return;

    hoverFrame = requestAnimationFrame(() => {
        hoverFrame = null;

        if (pieceAt(event.clientX, event.clientY)) {
            root.dataset.blobHover = "";
        } else {
            delete root.dataset.blobHover;
        }
    });
}

function endDrag() {
    if (!drag) return;

    const { piece } = drag;
    drag = null;
    delete root.dataset.blobDrag;

    piece.style.transition = "translate 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)";
    piece.style.translate = "0px 0px";

    piece.addEventListener("transitionend", () => {
        piece.style.removeProperty("transition");
        piece.style.removeProperty("translate");
        piece.style.removeProperty("animation");
        piece.style.animationDelay = "0s";
    }, { once: true });
}

function pieceCircles() {
    return [...blobField.querySelectorAll(".blob-field__piece")].map((piece) => {
        const rect = piece.getBoundingClientRect();
        const radius = rect.width / 2;
        return { x: rect.left + radius, y: rect.top + radius, radius };
    });
}

function lineGradient(line, circles) {
    const rect = line.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return null;

    const segments = circles
        .filter((circle) => Math.abs(rect.top - circle.y) < circle.radius)
        .map((circle) => {
            const half = Math.sqrt(circle.radius ** 2 - (rect.top - circle.y) ** 2);
            return [circle.x - half - rect.left, circle.x + half - rect.left];
        })
        .filter(([start, end]) => end > 0 && start < rect.width)
        .sort((a, b) => a[0] - b[0]);

    const merged = [];
    for (const segment of segments) {
        const last = merged.at(-1);
        if (last && segment[0] <= last[1] + lineFade * 2) {
            last[1] = Math.max(last[1], segment[1]);
        } else {
            merged.push([...segment]);
        }
    }

    if (!merged.length) return null;

    const stops = merged.map(([start, end]) => [
        `${lineColor} ${start - lineFade}px`,
        `transparent ${start}px`,
        `transparent ${end}px`,
        `${lineColor} ${end + lineFade}px`,
    ].join(", "));

    return `linear-gradient(90deg, ${stops.join(", ")})`;
}

function paintLines() {
    const circles = pieceCircles();
    const gradients = [...blobLines].map((line) => lineGradient(line, circles));

    blobLines.forEach((line, index) => {
        if (gradients[index]) {
            line.style.setProperty("--blob-line", gradients[index]);
        } else {
            line.style.removeProperty("--blob-line");
        }
    });

    requestAnimationFrame(paintLines);
}

if (blobField) {
    document.addEventListener("pointerdown", startDrag);
    document.addEventListener("pointermove", moveDrag);
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", endDrag);

    if (blobLines.length) paintLines();
}
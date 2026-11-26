const blobField = document.querySelector(".blob-field");
const root = document.documentElement;
const interactiveSelector = "a, button, input, textarea, select, label";
const blobLines = document.querySelectorAll("[data-blob-line]");
const lineColor = "var(--line-color)";
const lineFade = 24;
const visibleRadius = 0.7;
const grabEase = 0.85;

let drag = null;
let hoverFrame = null;

function centerOf(element) {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function pieceAt(x, y) {
    let closest = null;
    let closestDistance = visibleRadius;

    blobField.querySelectorAll(".blob-field__piece").forEach((piece) => {
        const center = centerOf(piece);
        const radius = piece.getBoundingClientRect().width / 2;
        const distance = Math.hypot(x - center.x, y - center.y) / radius;

        if (distance <= closestDistance) {
            closest = piece;
            closestDistance = distance;
        }
    });

    return closest;
}

function canGrab(event) {
    return event.pointerType !== "touch" && !event.target.closest(interactiveSelector);
}

function scaleOf(element) {
    return element.getBoundingClientRect().width / element.offsetWidth;
}

function followPointer() {
    if (!drag) return;

    drag.grabX *= grabEase;
    drag.grabY *= grabEase;

    const blobCenter = centerOf(drag.blob);
    const scale = scaleOf(drag.blob);
    const x = (drag.pointerX - drag.grabX - blobCenter.x) / scale - drag.anchorX;
    const y = (drag.pointerY - drag.grabY - blobCenter.y) / scale - drag.anchorY;

    drag.piece.style.translate = `${x}px ${y}px`;
    requestAnimationFrame(followPointer);
}

function startDrag(event) {
    if (event.button !== 0 || !canGrab(event)) return;

    const piece = pieceAt(event.clientX, event.clientY);
    if (!piece) return;

    event.preventDefault();

    const pieceCenter = centerOf(piece);
    const blob = piece.parentElement;

    drag = {
        piece,
        blob,
        rest: getComputedStyle(piece).translate,
        grabX: event.clientX - pieceCenter.x,
        grabY: event.clientY - pieceCenter.y,
        pointerX: event.clientX,
        pointerY: event.clientY,
    };

    piece.style.transition = "none";
    piece.style.animation = "none";
    piece.style.translate = "0px 0px";

    const anchor = centerOf(piece);
    const blobCenter = centerOf(blob);
    const scale = scaleOf(blob);

    drag.anchorX = (anchor.x - blobCenter.x) / scale;
    drag.anchorY = (anchor.y - blobCenter.y) / scale;

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

    const { piece, rest } = drag;
    drag = null;
    delete root.dataset.blobDrag;

    piece.style.transition = "translate 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)";
    piece.style.translate = rest;

    piece.addEventListener("transitionend", () => {
        piece.style.removeProperty("transition");
        piece.style.removeProperty("translate");
        piece.style.removeProperty("animation");
        piece.style.animationDelay = "0s";
    }, { once: true });
}

function pieceCircles() {
    return [...blobField.querySelectorAll(".blob-field__piece")].map((piece) => {
        const center = centerOf(piece);
        const radius = (piece.getBoundingClientRect().width / 2) * visibleRadius;
        return { ...center, radius };
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
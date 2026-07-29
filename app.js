import {
    parseSvg,
    getPathElements,
    analyzePath,
    closePathData,
    updatePathData,
    serializeSvg,
    validateSvgText,
    validateRepairedPaths,
} from "./modules/pathCloser.js";
const fileInput = document.querySelector("#svg-file");
const resultsSection = document.querySelector("#results");
const statusMessage = document.querySelector("#status-message");
const fixButton = document.querySelector("#fix-button");
const downloadButton = document.querySelector("#download-button");
const repairSummary = document.querySelector("#repair-summary");
const pathsScanned = document.querySelector("#paths-scanned");
const openPathsFound = document.querySelector("#open-paths-found");
const pathsRepaired = document.querySelector("#paths-repaired");
const pathsSkipped = document.querySelector("#paths-skipped");
const validationStatus =
    document.querySelector("#validation-status");
const openPathsCard =
    document.querySelector("#open-paths-card");

const openPathReview =
    document.querySelector("#open-path-review");

const openPathList =
    document.querySelector("#open-path-list");
const svgPreview =
    document.querySelector("#svg-preview");
let svgText = "";
let svgDocument = null;
let pendingRepairs = [];
let repairedSvgText = "";
let originalFileName = "";
let currentOpenPaths = [];
function createPreviewSvg(svgDocument) {
    const previewSvg = document.importNode(
        svgDocument.documentElement,
        true
    );

    previewSvg
        .querySelectorAll("script, foreignObject")
        .forEach((element) => element.remove());

    const previewElements = [
        previewSvg,
        ...previewSvg.querySelectorAll("*"),
    ];

    previewElements.forEach((element) => {
        [...element.attributes].forEach((attribute) => {
            const attributeName = attribute.name.toLowerCase();
            const attributeValue = attribute.value
                .trim()
                .toLowerCase();

            if (attributeName.startsWith("on")) {
                element.removeAttribute(attribute.name);
            }

            const isExternalLink =
                attributeName === "href" ||
                attributeName === "xlink:href";

            if (
                isExternalLink &&
                !attributeValue.startsWith("#")
            ) {
                element.removeAttribute(attribute.name);
            }
        });
    });

    previewSvg.removeAttribute("width");
    previewSvg.removeAttribute("height");
    previewSvg.classList.add("preview-svg");

    return previewSvg;
}
fileInput.addEventListener("change", async () => {
    const selectedFile = fileInput.files[0];


    if (!selectedFile) {
        return;
    }

    originalFileName = selectedFile.name;


    repairedSvgText = "";
    pendingRepairs = [];

    fixButton.disabled = true;
    downloadButton.disabled = true;

    repairSummary.hidden = true;
    pathsRepaired.textContent = 0;
    validationStatus.textContent = "Not run";

    try {
        svgText = await selectedFile.text();
        svgDocument = parseSvg(svgText);
    } catch (error) {
        resultsSection.hidden = false;
        repairSummary.hidden = true;

        statusMessage.textContent = error.message;

        return;
    }

    const pathElements = getPathElements(svgDocument);
    if (pathElements.length === 0) {
        resultsSection.hidden = false;
        repairSummary.hidden = false;

        pathsScanned.textContent = 0;
        openPathsFound.textContent = 0;
        pathsRepaired.textContent = 0;
        pathsSkipped.textContent = 0;

        statusMessage.textContent =
            "No SVG path elements were found in this file.";

        return;
    }


    const pathAnalyses = pathElements.map((pathElement) =>
        analyzePath(pathElement)

    );
    const repairablePaths = pathAnalyses.filter(
        (analysis) =>
            !analysis.isClosed &&
            analysis.gapType !== "large-gap"
    );


    const openPaths = pathAnalyses.filter(
        (analysis) => !analysis.isClosed
    );
    currentOpenPaths = openPaths;

    const skippedPaths =
        openPaths.length - repairablePaths.length;


    repairSummary.hidden = false;
    pathsScanned.textContent = pathAnalyses.length;
    openPathsFound.textContent = openPaths.length;
    pathsRepaired.textContent = 0;
    pathsSkipped.textContent = skippedPaths;



    pendingRepairs = repairablePaths.map((analysis) => ({
        pathElement: analysis.pathElement,
        pathData: closePathData(analysis.pathData),
    }));

    fixButton.disabled = pendingRepairs.length === 0;







    resultsSection.hidden = false;
    statusMessage.textContent = `Selected file: ${selectedFile.name}`;
});
openPathsCard.addEventListener("click", () => {
    openPathList.innerHTML = "";
    svgPreview.replaceChildren();

    const previewSvg = createPreviewSvg(svgDocument);

    svgPreview.append(previewSvg);
    const originalPaths = getPathElements(svgDocument);

    const previewPathElements = [
        ...previewSvg.querySelectorAll("path"),
    ];
    requestAnimationFrame(() => {
        const previewPaths = [
            ...previewSvg.querySelectorAll("path"),
        ];

        const svgMatrix = previewSvg.getScreenCTM();

        if (previewPaths.length === 0 || !svgMatrix) {
            return;
        }

        const screenToSvg = svgMatrix.inverse();

        const points = previewPaths.flatMap((path) => {
            const bounds = path.getBoundingClientRect();

            return [
                new DOMPoint(bounds.left, bounds.top),
                new DOMPoint(bounds.right, bounds.top),
                new DOMPoint(bounds.right, bounds.bottom),
                new DOMPoint(bounds.left, bounds.bottom),
            ].map((point) =>
                point.matrixTransform(screenToSvg)
            );
        });

        const xValues = points.map((point) => point.x);
        const yValues = points.map((point) => point.y);

        const minimumX = Math.min(...xValues);
        const maximumX = Math.max(...xValues);
        const minimumY = Math.min(...yValues);
        const maximumY = Math.max(...yValues);

        const drawingWidth = maximumX - minimumX;
        const drawingHeight = maximumY - minimumY;

        if (drawingWidth <= 0 || drawingHeight <= 0) {
            return;
        }

        const padding =
            Math.max(drawingWidth, drawingHeight) * 0.05;

        previewSvg.setAttribute(
            "viewBox",
            [
                minimumX - padding,
                minimumY - padding,
                drawingWidth + padding * 2,
                drawingHeight + padding * 2,
            ].join(" ")
        );

        previewSvg.setAttribute(
            "preserveAspectRatio",
            "xMidYMid meet"
        );

    });
    function updatePendingRepairsFromSelection() {
        const selectedCheckboxes = [
            ...openPathList.querySelectorAll(
                'input[type="checkbox"]:checked'
            ),
        ];

        pendingRepairs = selectedCheckboxes.map((checkbox) => {
            const pathIndex = Number(checkbox.dataset.pathIndex);
            const analysis = currentOpenPaths[pathIndex];

            return {
                pathElement: analysis.pathElement,
                pathData: closePathData(analysis.pathData),
            };
        });

        fixButton.disabled = pendingRepairs.length === 0;

        pathsSkipped.textContent =
            currentOpenPaths.length - pendingRepairs.length;
    }
    currentOpenPaths.forEach((analysis, index) => {
        const option = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.addEventListener(
            "change",
            updatePendingRepairsFromSelection
        );
        checkbox.type = "checkbox";
        checkbox.dataset.pathIndex = index;
        checkbox.checked = analysis.gapType !== "large-gap";
        const originalPathIndex =
            originalPaths.indexOf(analysis.pathElement);

        const previewPath =
            previewPathElements[originalPathIndex];

        if (previewPath) {
            previewPath.classList.toggle(
                "review-selected",
                checkbox.checked
            );
            const pathLength = previewPath.getTotalLength();

            const bridgeStart =
                previewPath.getPointAtLength(0);

            const bridgeEnd =
                previewPath.getPointAtLength(pathLength);

            const bridge = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

            bridge.setAttribute("x1", bridgeEnd.x);
            bridge.setAttribute("y1", bridgeEnd.y);
            bridge.setAttribute("x2", bridgeStart.x);
            bridge.setAttribute("y2", bridgeStart.y);

            const pathTransform =
                previewPath.getAttribute("transform");

            if (pathTransform) {
                bridge.setAttribute("transform", pathTransform);
            }

            bridge.classList.add("gap-bridge");

            bridge.style.display =
                checkbox.checked ? "" : "none";

            previewPath.parentNode.append(bridge);

            checkbox.addEventListener("change", () => {
                bridge.style.display =
                    checkbox.checked ? "" : "none";
            });
        }
        checkbox.addEventListener("change", () => {
            previewPath.classList.toggle(
                "review-selected",
                checkbox.checked
            );
        });
        updatePendingRepairsFromSelection();
        const gapDistance = analysis.gapDistance.toFixed(2);
        const recommendation =
            analysis.gapType === "large-gap"
                ? "Manual review"
                : "Recommended";

        option.append(
            checkbox,
            ` Path ${index + 1} — ${gapDistance} unit gap — ${recommendation}`
        );

        openPathList.append(option);
    });

    openPathReview.hidden = false;
});
fixButton.addEventListener("click", () => {
    if (pendingRepairs.length === 0) {
        return;
    }

    pendingRepairs.forEach((repair) => {
        updatePathData(repair.pathElement, repair.pathData);
    });
    const pathValidation =
        validateRepairedPaths(pendingRepairs);

    if (!pathValidation.isValid) {
        repairedSvgText = "";
        downloadButton.disabled = true;

        statusMessage.textContent =
            pathValidation.message;
        validationStatus.textContent = "Failed";
        return;
    }

    repairedSvgText = serializeSvg(svgDocument);
    const validationResult = validateSvgText(repairedSvgText);


    downloadButton.disabled = !validationResult.isValid;
    validationStatus.textContent =
        validationResult.isValid ? "Passed" : "Failed";

    const repairedCount = pendingRepairs.length;
    pathsRepaired.textContent = repairedCount;

    pendingRepairs = [];
    if (!validationResult.isValid) {
        repairedSvgText = "";
    }
    fixButton.disabled = true;

    statusMessage.textContent =
        `${repairedCount} open path${repairedCount === 1 ? "" : "s"} repaired successfully.`;


});
downloadButton.addEventListener("click", () => {
    if (!repairedSvgText) {
        return;
    }

    const svgBlob = new Blob(
        [repairedSvgText],
        { type: "image/svg+xml" }
    );

    const downloadUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    const cleanedFileName = originalFileName.replace(
        /\.svg$/i,
        "-cleaned.svg"
    );

    downloadLink.download = cleanedFileName;
    downloadLink.click();

    URL.revokeObjectURL(downloadUrl);
});
import {
    login,
    registerAccount,
    refreshSession,
    clearSession,
    getCurrentUser,
    hasEntitlement,
    startPathSealCheckout,
    confirmPathSealCheckout,
} from "./modules/auth.js";

import {
    parseSvg,
    getPathElements,
    analyzeContours,
    createContourBridge,
    analyzePath,
    closePathData,
    serializeSvg,
    validateSvgText,
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

const accountStatus =
    document.querySelector("#account-status");

const accountFields =
    document.querySelector("#account-fields");

const accountSession =
    document.querySelector("#account-session");

const accountEmail =
    document.querySelector("#account-email");

const accountUsername =
    document.querySelector("#account-username");

const accountPassword =
    document.querySelector("#account-password");

const accountName =
    document.querySelector("#account-name");

const loginButton =
    document.querySelector("#login-button");

const registerButton =
    document.querySelector("#register-button");

const subscribeButton =
    document.querySelector("#subscribe-button");

const logoutButton =
    document.querySelector("#logout-button");


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


function getContourElements(analysis) {
    return analysis.component.edges.map(
        (edge) => edge.pathElement
    );
}

function renderAccountState() {
    const user = getCurrentUser();
    const pathSealUnlocked =
        hasEntitlement("pathseal");

    accountFields.hidden = Boolean(user);
    accountSession.hidden = !user;

    if (!user) {
        accountStatus.textContent =
            "Scan and review are free. Sign in to repair and download.";
        accountName.textContent = "";
        subscribeButton.hidden = false;
        return;
    }

    accountName.textContent =
        user.username || user.email;

    if (pathSealUnlocked) {
        accountStatus.textContent =
            "PathSeal repair and download are unlocked.";
        subscribeButton.hidden = true;
    } else {
        accountStatus.textContent =
            "Signed in. Subscribe to unlock repair and download.";
        subscribeButton.hidden = false;
    }
}

async function handleLogin() {
    const email = accountEmail.value.trim();
    const password = accountPassword.value;

    if (!email || !password) {
        accountStatus.textContent =
            "Enter your email and password.";
        return;
    }

    loginButton.disabled = true;
    registerButton.disabled = true;
    accountStatus.textContent = "Signing in...";

    try {
        await login(email, password);

        accountPassword.value = "";
        renderAccountState();
    } catch (error) {
        accountStatus.textContent =
            error.message || "Sign-in failed.";
    } finally {
        loginButton.disabled = false;
        registerButton.disabled = false;
    }
}

async function handleRegister() {
    const email = accountEmail.value.trim();
    const username = accountUsername.value.trim();
    const password = accountPassword.value;

    if (!email || !username || !password) {
        accountStatus.textContent =
            "Enter an email, username, and password.";
        return;
    }

    loginButton.disabled = true;
    registerButton.disabled = true;
    accountStatus.textContent =
        "Creating your account...";

    try {
        await registerAccount(
            email,
            username,
            password
        );

        accountPassword.value = "";
        renderAccountState();
    } catch (error) {
        accountStatus.textContent =
            error.message ||
            "Account creation failed.";
    } finally {
        loginButton.disabled = false;
        registerButton.disabled = false;
    }
}

async function handleSubscribe() {
    subscribeButton.disabled = true;
    accountStatus.textContent =
        "Opening secure checkout...";

    try {
        await startPathSealCheckout();
    } catch (error) {
        accountStatus.textContent =
            error.message ||
            "Checkout could not be opened.";

        subscribeButton.disabled = false;
    }
}

function handleLogout() {
    clearSession();

    accountEmail.value = "";
    accountUsername.value = "";
    accountPassword.value = "";

    renderAccountState();
}

async function initializeAccount() {
    renderAccountState();

    const urlParameters =
        new URLSearchParams(
            window.location.search
        );

    const checkoutResult =
        urlParameters.get("checkout");

    const sessionId =
        urlParameters.get("session_id");

    if (
        checkoutResult === "success" &&
        sessionId
    ) {
        accountStatus.textContent =
            "Confirming PathSeal access...";

        try {
            await confirmPathSealCheckout(
                sessionId
            );

            renderAccountState();

            if (hasEntitlement("pathseal")) {
                accountStatus.textContent =
                    "PathSeal repair and download are unlocked.";
            } else {
                accountStatus.textContent =
                    "Payment received. Access is still being confirmed.";
            }
        } catch (error) {
            accountStatus.textContent =
                error.message ||
                "Checkout confirmation failed.";
        }
    } else if (checkoutResult === "cancel") {
        accountStatus.textContent =
            "Checkout canceled. Your account was not charged.";
    } else if (getCurrentUser()) {
        try {
            await refreshSession();
        } catch {
            // Invalid sessions are cleared by auth.js.
        }

        renderAccountState();
    }

    if (checkoutResult) {
        urlParameters.delete("checkout");
        urlParameters.delete("session_id");

        const remainingQuery =
            urlParameters.toString();

        const cleanUrl =
            window.location.pathname +
            (
                remainingQuery
                    ? `?${remainingQuery}`
                    : ""
            ) +
            window.location.hash;

        window.history.replaceState(
            {},
            "",
            cleanUrl
        );
    }
}

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


        const contourAnalyses =
        analyzeContours(pathElements);

    const repairableContours =
        contourAnalyses.filter(
            (analysis) =>
                analysis.hasSingleOpenGap &&
                analysis.gapType !== "large-gap"
        );

    const openContours =
        contourAnalyses.filter(
            (analysis) => !analysis.isClosed
        );

    currentOpenPaths = openContours;

    const skippedContours =
        openContours.length -
        repairableContours.length;

    repairSummary.hidden = false;
    pathsScanned.textContent =
        contourAnalyses.length;
    openPathsFound.textContent =
        openContours.length;
    pathsRepaired.textContent = 0;
    pathsSkipped.textContent =
        skippedContours;

    pendingRepairs = [
        ...repairableContours,
    ];

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
        ...previewSvg.querySelectorAll("path, line"),
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
    const contourIndex = Number(
        checkbox.dataset.pathIndex
    );

    return currentOpenPaths[contourIndex];
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

        const previewContourElements =
            getContourElements(analysis)
                .map((element) => {
                    const originalIndex =
                        originalPaths.indexOf(element);

                    return previewPathElements[originalIndex];
                })
                .filter(Boolean);

        const updateContourPreview = () => {
            previewContourElements.forEach((element) => {
                element.classList.toggle(
                    "review-selected",
                    checkbox.checked
                );
            });
        };

        updateContourPreview();

        if (
            previewContourElements.length > 0 &&
            analysis.endpoints
        ) {
            const bridge = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

            bridge.setAttribute(
                "x1",
                analysis.endpoints.start.x
            );
            bridge.setAttribute(
                "y1",
                analysis.endpoints.start.y
            );
            bridge.setAttribute(
                "x2",
                analysis.endpoints.end.x
            );
            bridge.setAttribute(
                "y2",
                analysis.endpoints.end.y
            );

            bridge.classList.add("gap-bridge");

            const updateBridgeVisibility = () => {
                bridge.style.display =
                    checkbox.checked ? "" : "none";
            };

            updateBridgeVisibility();

            previewContourElements[0]
                .parentNode.append(bridge);

            checkbox.addEventListener(
                "change",
                updateBridgeVisibility
            );
        }

        checkbox.addEventListener(
            "change",
            updateContourPreview
        );

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
        if (!hasEntitlement("pathseal")) {
        accountStatus.textContent =
            getCurrentUser()
                ? "Subscribe to unlock PathSeal repair."
                : "Sign in or create an account to unlock PathSeal repair.";

        document
            .querySelector("#account-panel")
            .scrollIntoView({
                behavior: "smooth",
                block: "start",
            });

        return;
    }

    if (pendingRepairs.length === 0) {
        return;
    }

    const repairedCount = pendingRepairs.length;

    pendingRepairs.forEach((repair) => {
        createContourBridge(repair);
    });

    repairedSvgText = serializeSvg(svgDocument);
    const validationResult =
        validateSvgText(repairedSvgText);

    if (!validationResult.isValid) {
        repairedSvgText = "";
        downloadButton.disabled = true;
        validationStatus.textContent = "Failed";
        statusMessage.textContent =
            validationResult.message ||
            "The repaired SVG failed validation.";
        return;
    }

    downloadButton.disabled = false;
    validationStatus.textContent = "Passed";
    pathsRepaired.textContent = repairedCount;
    pendingRepairs = [];
    fixButton.disabled = true;

    statusMessage.textContent =
        `${repairedCount} open contour${repairedCount === 1 ? "" : "s"} repaired successfully.`;

});
downloadButton.addEventListener("click", () => {
        if (!hasEntitlement("pathseal")) {
        accountStatus.textContent =
            getCurrentUser()
                ? "Subscribe to unlock clean SVG downloads."
                : "Sign in or create an account to unlock clean SVG downloads.";

        document
            .querySelector("#account-panel")
            .scrollIntoView({
                behavior: "smooth",
                block: "start",
            });

        return;
    }

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

loginButton.addEventListener(
    "click",
    handleLogin
);

registerButton.addEventListener(
    "click",
    handleRegister
);

subscribeButton.addEventListener(
    "click",
    handleSubscribe
);

logoutButton.addEventListener(
    "click",
    handleLogout
);

initializeAccount();
/** SVG-only activation API client. Does not modify shared auth or local tools. */
const SVG_ACTIVATE_URL = "https://mab-path-editor.onrender.com/api/svg/activate";

export async function activateSvgLifetime(code, accessToken, fetchApi = fetch) {
    if (!accessToken) throw new Error("Sign in required.");
    if (!/^SVG1-[0-9A-F]{32}$/.test(code)) {
        throw new Error("Invalid SVG lifetime activation code.");
    }
    const response = await fetchApi(SVG_ACTIVATE_URL, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + accessToken,
        },
        body: JSON.stringify({ code }),
    });
    let payload = null;
    try { payload = await response.json(); } catch { /* no JSON */ }
    if (!response.ok) {
        throw new Error(payload?.detail || "SVG lifetime activation unavailable.");
    }
    return payload;
}

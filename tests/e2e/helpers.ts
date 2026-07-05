export function getTenantUrl(tenant: string, path: string = "/", useSubdomain = true) {
  const baseUrl = (process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3100").replace(/\/$/, "");
  if (useSubdomain) {
    if (tenant === "marketing" || tenant === "www") {
      return `${baseUrl}${path}`;
    }
    const url = new URL(baseUrl);
    return `${url.protocol}//${tenant}.${url.host}${path}`;
  } else {
    const separator = path.includes("?") ? "&" : "?";
    return `${baseUrl}${path}${separator}__cafe=${tenant}`;
  }
}

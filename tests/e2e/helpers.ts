export function getTenantUrl(tenant: string, path: string = "/", useSubdomain = true) {
  const baseUrl = "localhost:3000";
  if (useSubdomain) {
    if (tenant === "marketing" || tenant === "www") {
      return `http://${baseUrl}${path}`;
    }
    return `http://${tenant}.${baseUrl}${path}`;
  } else {
    const separator = path.includes("?") ? "&" : "?";
    return `http://${baseUrl}${path}${separator}__cafe=${tenant}`;
  }
}

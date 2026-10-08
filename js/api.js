/* Imibavu Collection — API client
   - Access token lives in memory only (never localStorage)
   - Refresh token is an httpOnly cookie; on 401 we silently refresh and retry */
const api = (() => {
  let accessToken = null;
  let refreshing = null;

  function setAccessToken(t) { accessToken = t || null; }
  function getAccessToken() { return accessToken; }

  async function request(path, opts = {}) {
    const { method = "GET", body, retry = true } = opts;
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (accessToken) headers["Authorization"] = "Bearer " + accessToken;

    let res;
    try {
      res = await fetch(API_BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: "include",
      });
    } catch (e) {
      throw { status: 0, code: "NETWORK", message: "Cannot reach the server — are you online?" };
    }

    if (res.status === 401 && retry && !path.startsWith("/auth/login") && !path.startsWith("/auth/register")) {
      const ok = await refresh();
      if (ok) return request(path, { method, body, retry: false });
    }

    let data = null;
    try { data = await res.json(); } catch (e) { /* empty body */ }

    if (!res.ok) {
      const err = (data && data.error) || {};
      throw {
        status: res.status,
        code: err.code || "ERROR",
        message: err.message || "Request failed",
        details: err.details,
      };
    }
    return data;
  }

  async function refresh() {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      try {
        const res = await fetch(API_BASE + "/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) { accessToken = null; return false; }
        const data = await res.json();
        accessToken = data.accessToken || null;
        return data;
      } catch (e) {
        accessToken = null;
        return false;
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  }

  const get = (path) => request(path);
  const post = (path, body) => request(path, { method: "POST", body: body || {} });

  async function logout() {
    try { await post("/auth/logout"); } catch (e) { /* cookie may already be gone */ }
    accessToken = null;
  }

  return { get, post, refresh, logout, setAccessToken, getAccessToken };
})();

import { GitHubUser, GitHubRepo, FileNode } from "../types/ide";

const GITHUB_API_URL = "https://api.github.com";

const getHeaders = (token: string) => ({
  Accept: "application/vnd.github.v3+json",
  Authorization: `token ${token}`,
  "User-Agent": "ElcomCLI",
});

export const githubService = {
  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<string> {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`TOKEN_EXCHANGE_FAILED: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`GITHUB_AUTH_ERROR: ${data.error_description || data.error}`);
    }

    if (!data.access_token) {
      throw new Error("NO_ACCESS_TOKEN_RECEIVED");
    }

    return data.access_token;
  },

  async getUser(token: string): Promise<GitHubUser> {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`GET_USER_FAILED: ${response.status}`);
    }

    return response.json();
  },

  async getRepos(token: string): Promise<GitHubRepo[]> {
    const response = await fetch(`${GITHUB_API_URL}/user/repos?per_page=100&sort=updated`, {
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`GET_REPOS_FAILED: ${response.status}`);
    }

    return response.json();
  },

  async getRepoTree(
    token: string,
    owner: string,
    repo: string,
    sha: string = "main",
  ): Promise<FileNode[]> {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
      {
        headers: getHeaders(token),
      },
    );

    if (!response.ok) {
      throw new Error(`GET_TREE_FAILED: ${response.status}`);
    }

    const data = await response.json();
    if (!data.tree || !Array.isArray(data.tree)) {
      throw new Error("INVALID_TREE_RESPONSE");
    }

    return data.tree;
  },

  async getFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string,
  ): Promise<{ content: string; sha: string }> {
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: getHeaders(token),
      },
    );

    if (!response.ok) {
      throw new Error(`GET_FILE_FAILED: ${response.status}`);
    }

    const data = await response.json();
    // GitHub API returns base64 content with newlines, remove them
    const cleanBase64 = data.content.replace(/\s/g, "");
    return {
      content: cleanBase64,
      sha: data.sha,
    };
  },

  async updateFile(
    token: string,
    owner: string,
    repo: string,
    path: string,
    contentBase64: string,
    message: string,
    sha?: string,
  ): Promise<{ sha: string }> {
    const body: Record<string, string> = {
      message,
      content: contentBase64,
    };
    if (sha) body.sha = sha;

    const response = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          ...getHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`UPDATE_FILE_FAILED: ${errData.message || response.status}`);
    }

    const data = await response.json();
    return {
      sha: data.content.sha,
    };
  },
};

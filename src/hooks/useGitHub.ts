import { useState, useEffect, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { githubService } from "../services/githubService";
import { GitHubUser } from "../types/ide";

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = "github_oauth_token";

export const useGitHub = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // GitHub Auth Endpoints
  const discovery = {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
  };

  const clientId = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || "";
  const clientSecret = process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET || "";

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "kimkocli",
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ["repo", "user"],
      redirectUri,
    },
    discovery,
  );

  const loadSavedSession = useCallback(async () => {
    try {
      const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (savedToken) {
        setToken(savedToken);
        const userData = await githubService.getUser(savedToken);
        setUser(userData);
      }
    } catch (error) {
      console.error("useGitHub: Failed to restore saved GitHub token", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithToken = useCallback(async (patToken: string) => {
    setIsLoading(true);
    try {
      const userData = await githubService.getUser(patToken);
      await SecureStore.setItemAsync(TOKEN_KEY, patToken);
      setToken(patToken);
      setUser(userData);
      return true;
    } catch (error) {
      Alert.alert("Authentication Failed", "Invalid GitHub Personal Access Token.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithOAuth = useCallback(async () => {
    if (!clientId || !clientSecret) {
      Alert.alert(
        "OAuth Config Missing",
        "Please specify GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your environment or enter a Personal Access Token.",
      );
      return;
    }

    console.log("useGitHub: Redirect URI sent to GitHub:", redirectUri);
    setIsLoading(true);
    try {
      const result = await promptAsync();
      if (result.type === "success" && result.params.code) {
        const code = result.params.code;
        const accessToken = await githubService.exchangeCodeForToken(
          code,
          clientId,
          clientSecret,
          redirectUri,
          request?.codeVerifier,
        );

        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        setToken(accessToken);
        const userData = await githubService.getUser(accessToken);
        setUser(userData);
      }
    } catch (error: any) {
      console.error("useGitHub: OAuth error", error);
      Alert.alert("Authentication Failed", error.message || "OAuth login encountered an error.");
    } finally {
      setIsLoading(false);
    }
  }, [promptAsync, clientId, clientSecret, redirectUri]);

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("useGitHub: Logout failed", error);
    }
  }, []);

  useEffect(() => {
    loadSavedSession();
  }, [loadSavedSession]);

  return {
    token,
    user,
    isLoading,
    loginWithOAuth,
    loginWithToken,
    logout,
    authRequest: request,
    redirectUri,
  };
};

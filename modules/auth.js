const axios = require('axios');

class AuthManager {
    constructor(config) {
        this.clientId = config.authClientId;
        this.clientSecret = config.authClientSecret;
        this.redirectUri = config.authRedirectUri;
        this.proxy = config.authProxy;

        this.authUrl = 'https://connect.linux.do/oauth2/authorize';
        this.tokenUrl = 'https://connect.linux.do/oauth2/token';
        this.userInfoUrl = 'https://connect.linux.do/api/user';

        this.sessions = new Map(); // token -> userInfo
    }

    getAxiosConfig() {
        const config = {};
        if (this.proxy) {
            const { HttpsProxyAgent } = require('https-proxy-agent');
            config.proxy = false;
            config.httpsAgent = new HttpsProxyAgent(this.proxy);
        }
        return config;
    }

    getAuthUrl(state) {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'user',
            state: state || ''
        });
        return `${this.authUrl}?${params.toString()}`;
    }

    async getAccessToken(code) {
        const form = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: code,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code'
        }).toString();

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            ...this.getAxiosConfig()
        };

        const response = await axios.post(this.tokenUrl, form, config);
        return response.data;
    }

    async getUserInfo(accessToken) {
        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            ...this.getAxiosConfig()
        };

        const response = await axios.get(this.userInfoUrl, config);
        return response.data;
    }

    createSession(token, userInfo) {
        this.sessions.set(token, {
            userInfo,
            createdAt: Date.now()
        });
        return token;
    }

    validateSession(token) {
        const session = this.sessions.get(token);
        if (!session) return null;

        // Session expires after 24 hours
        if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
            this.sessions.delete(token);
            return null;
        }

        return session.userInfo;
    }

    isEnabled() {
        return this.clientId && this.clientSecret;
    }
}

module.exports = AuthManager;

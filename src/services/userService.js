import authApi from "@/assets/api/auth";

export async function login(credentials) {
    try {
        const loginRes = await authApi.login(credentials);
        if (loginRes.data.success == true) {
            localStorage.setItem("token", loginRes.data.token);
            return loginRes.data;
        } else {
            throw new Error(loginRes.data.message);
        }
    } catch (error) {
        return {
            success: false,
            error
        }
    }

}


export async function register(userData) {
    try {
        const registerRes = await authApi.register(userData);
        console.log(registerRes);
        if (registerRes.data.success == true) {
            localStorage.setItem("token", registerRes.data.token);
            return registerRes.data;
        }
    } catch (error) {

        return {
            success: false,
            error
        }
    }
}

export async function refreshToken() {
    try {
        const refreshTokenRes = await authApi.refreshToken();
        console.log(refreshTokenRes);
        if (refreshTokenRes.success == true) {
            localStorage.setItem("token", refreshTokenRes.data.token);
            return refreshTokenRes.data;
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            error
        }
    }
}


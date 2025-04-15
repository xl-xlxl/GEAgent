import authApi from "@/assets/api/auth";
import { ref } from "vue";
import { useUserStore } from "@/stores/userStore";

export async function login(credentials) {
    try {
        const loginRes = await authApi.login(credentials);
        if (loginRes.data.success == true) {
            const userStore = useUserStore();
            // 使用store的login action而不是直接设置loggedIn属性
            userStore.login(loginRes.data.user, loginRes.data.token);
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
        if (refreshTokenRes.data.success == true) {
            localStorage.setItem("token", refreshTokenRes.data.token);
            return refreshTokenRes.data;
        }
    } catch (error) {
        return {
            success: false,
            error
        }
    }
}

export async function getUserInfo() {
    try {
        const userDataRes = await authApi.getUserInfo();
        if (userDataRes.data.success == true) {
            return userDataRes.data;
        }
    }catch (error) {
        return {
            success: false,
            error
        }
    }
}

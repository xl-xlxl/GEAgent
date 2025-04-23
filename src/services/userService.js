import authApi from "@/assets/api/auth";
import { ref } from "vue";
import { useUserStore } from "@/stores/userStore";
import { fromJSON } from "postcss";

export async function login(credentials) {
    try {
        const loginRes = await authApi.login(credentials);
        if (loginRes.data.success == true) {
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

export async function emailLogin(email) {
    try {
        const loginByEmailRes = await authApi.LoginByEmail(email);
        if (loginByEmailRes.data.success == true) {
            return loginByEmailRes.data;
        } else {
            throw new Error(loginByEmailRes.data.message);
        }
    } catch (error) {
        return {
            success: false,
            error
        }
    }
}

export async function sendVerificationCode(credentials) {
    try {
        const sendCodeRes = await authApi.sendVerificationCode(credentials);
        if (sendCodeRes.data.success == true) {
            return sendCodeRes.data;
        } else {
            throw new Error(sendCodeRes.data.message);
        }
    } catch (error) {
        return {
            success: false,
            error
        }
    }
}

export async function resetPassword(data) {
    try {
        const resetPasswordRes = await authApi.resetPassword(data);
        if (resetPasswordRes.data.success == true) {
            return resetPasswordRes.data;
        } else {
            throw new Error(resetPasswordRes.data.message);
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

export async function getUserAvatarUrl() {
    try {
        const avatarUrlRes = await authApi.getUserAvatarUrl();
        if (avatarUrlRes.data.success == true) {
            return avatarUrlRes.data;
        } else {
           return{
            success: false,
            url: null
                 } 
            }
        }catch (error) {
            return {
                success: false,
                error
            } 
        }
    
}

export async function uploadAvatar(file) {
    try {
        const uploadAvatarRes = await authApi.uploadAvatar(file);
        if (uploadAvatarRes.success == true) {
            return uploadAvatarRes;
        } else {
            throw new Error(uploadAvatarRes);
        }
    } catch (error) {
        return {
            success: false,
            error
        }
    }
}   
export async function updateInfo(userData) {
    try {
        const updateUserInfoRes = await authApi.updateInfo(userData);
        if (updateUserInfoRes.success == true) {
            return updateUserInfoRes;
        } else {
            throw new Error(updateUserInfoRes);
        }
    } catch (error) {
        return {
            success: false,
            error
        }
    }
}
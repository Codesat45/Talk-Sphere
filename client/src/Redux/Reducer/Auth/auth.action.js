import axios from "axios";
// import dotenv from "dotenv";
// action type

import {
  SIGN_IN,
  SIGN_UP,
  SIGN_OUT,
  USER_VERIFICATION,
  VERIFY_TOKEN,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  CLEAR_AUTH_STORE,
} from "./auth.type";

const SERVER_ACCESS_BASE_URL =
  process.env.REACT_APP_SERVER_ACCESS_BASE_URL || "http://localhost:5000";

const getErrorPayload = (error, fallbackMessage) => {
  return (
    error.response?.data || {
      message: fallbackMessage,
      success: false,
    }
  );
};

// Sign IN

export const signIn = (userData) => async (dispatch) => {
  try {
    // console.log(SERVER_ACCESS_BASE_URL);
    const User = await axios({
      method: "POST",
      url: `${SERVER_ACCESS_BASE_URL}/api/user/login/`,
      data: { ...userData },
    });
    // console.log(User);

    if (User.data.success && User.data.token) {
      localStorage.setItem(
        "ETalkUser",
        JSON.stringify({ token: User.data.token })
      );
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${User.data.token}`;
    }
    // window.location.reload();

    return dispatch({ type: SIGN_IN, payload: User.data });
  } catch (error) {
    return dispatch({
      type: "ERROR",
      payload: getErrorPayload(error, "Unable to sign in. Please try again."),
    });
  }
};

// Sign UP

export const signUp = (userData) => async (dispatch) => {
  try {
    const User = await axios({
      method: "POST",
      url: `${SERVER_ACCESS_BASE_URL}/api/user`,
      data: { ...userData },
    });

    if (User.data.success && User.data.token) {
      localStorage.setItem(
        "ETalkUser",
        JSON.stringify({ token: User.data.token })
      );
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${User.data.token}`;
    }

    return dispatch({ type: SIGN_UP, payload: User.data });
  } catch (error) {
    return dispatch({
      type: "ERROR",
      payload: getErrorPayload(error, "Unable to sign up. Please try again."),
    });
  }
};

// user VErication

export const userVerification = (data) => async (dispatch) => {
  try {
    // console.log(data.email);
    const verificationLink = await axios({
      method: "POST",
      url: `${SERVER_ACCESS_BASE_URL}/api/user/resend/verificationlink`,
      data: { ...data },
    });

    return dispatch({
      type: USER_VERIFICATION,
      payload: verificationLink.data,
    });
  } catch (error) {
    return dispatch({
      type: "ERROR",
      payload: getErrorPayload(
        error,
        "Unable to send verification email. Please try again."
      ),
    });
  }
};

// verify email link
export const verifyEmailLink = (token) => async (dispatch) => {
  try {
    const verificationStatus = await axios({
      method: "PUT",
      url: `${SERVER_ACCESS_BASE_URL}/api/user/verify`,
      data: { token },
    });
    return dispatch({ type: VERIFY_TOKEN, payload: verificationStatus.data });
  } catch (error) {
    return dispatch({
      type: "ERROR",
      payload: getErrorPayload(
        error,
        "Unable to verify email. Please try again."
      ),
    });
  }
};

// Forgot password
export const forgotPassword = (data) => async (dispatch) => {
  try {
    // console.log(data.email);
    const forgotPasswordStatus = await axios({
      method: "POST",
      url: `${SERVER_ACCESS_BASE_URL}/api/user/forgotpassword`,
      data: { ...data },
    });

    return dispatch({
      type: FORGOT_PASSWORD,
      payload: forgotPasswordStatus.data,
    });
  } catch (error) {
    return dispatch({
      type: "ERROR",
      payload: getErrorPayload(
        error,
        "Unable to send password reset email. Please try again."
      ),
    });
  }
};

// Reset password
export const resetPassword = (userData) => async (dispatch) => {
  try {
    // const { token, password } = userData;
    // console.log(data.email);
    // const data = {
    //   token: token,
    //   password: password,
    // };
    const resetPasswordStatus = await axios({
      method: "POST",
      url: `${SERVER_ACCESS_BASE_URL}/api/user/resetpassword`,
      data: userData,
    });

    return dispatch({
      type: RESET_PASSWORD,
      payload: resetPasswordStatus.data,
    });
  } catch (error) {
    return dispatch({
      type: "ERROR",
      payload: getErrorPayload(
        error,
        "Unable to reset password. Please try again."
      ),
    });
  }
};

// clar auth store
export const clearAuthStore = () => async (dispatch) => {
  try {
    return dispatch({ type: CLEAR_AUTH_STORE, payload: {} });
  } catch (error) {
    return dispatch({ type: "ERROR", payload: error });
  }
};

//   SIGN out

export const signOut = () => async (dispatch) => {
  try {
    localStorage.removeItem("ETalkUser");

    window.location.reload();

    return dispatch({ type: SIGN_OUT, payload: {} });
  } catch (error) {
    return dispatch({ type: "ERROR", payload: error });
  }
};

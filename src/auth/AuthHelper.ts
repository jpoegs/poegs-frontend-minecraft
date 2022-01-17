import {UserData} from "amazon-cognito-identity-js";
import {GetServerSideProps} from "next";
import {withSSRContext} from "aws-amplify";
import {CognitoUser} from "@aws-amplify/auth";
import Routes from "../lib/Routes";

const COGNITO_AUTH_PREFIX_KEY = process.env.NEXT_PUBLIC_COGNITO_AUTH_PREFIX_KEY;

export const WEB_AUTHN = {
    RP_ID: process.env.NEXT_PUBLIC_ROOT_DOMAIN
};

export enum CookieAuth {
    ACCESS_TOKEN = "accessToken",
    ID_TOKEN = "idToken",
    CLOCK_DRIFT = "clockDrift",
    REFRESH_TOKEN = "refreshToken",
    LAST_AUTH_USER = "LastAuthUser",
    DEVICE_GROUP_KEY = "deviceGroupKey",
    USER_DATA = "userData",
    RANDOM_PASSWORD = "randomPasswordKey",
    DEVICE_KEY = "deviceKey"
}

export interface AuthCookies {
    AccessToken?: string;
    IdToken?: string;
    ClockDrift?: string;
    RefreshToken?: string;
    DeviceGroupKey?: string;
    UserData?: UserInfo;
    RandomPassword?: string;
    DeviceKey?: string;
}

export interface UserInfo {
    sub?: string,
    name?: string;
    email?: string,
    family_name?: string;
    given_name?: string;
}

export function ParseAuthCookies(cookies: {[key: string]: string}): AuthCookies | null {
    const lastAuthUserKey = `${COGNITO_AUTH_PREFIX_KEY}.${CookieAuth.LAST_AUTH_USER}`;
    const lastAuthUser = cookies[lastAuthUserKey];
    if(lastAuthUser === undefined) {
        return null;
    }

    const cookieKeys = {
        AccessToken: `${COGNITO_AUTH_PREFIX_KEY}.${lastAuthUser}.${CookieAuth.ACCESS_TOKEN}`,
        IdToken: `${COGNITO_AUTH_PREFIX_KEY}.${lastAuthUser}.${CookieAuth.ID_TOKEN}`,
        ClockDrift: `${COGNITO_AUTH_PREFIX_KEY}.${lastAuthUser}.${CookieAuth.CLOCK_DRIFT}`,
        RefreshToken: `${COGNITO_AUTH_PREFIX_KEY}.${lastAuthUser}.${CookieAuth.REFRESH_TOKEN}`,
        DeviceGroupKey: `${COGNITO_AUTH_PREFIX_KEY}.${lastAuthUser}.${CookieAuth.DEVICE_GROUP_KEY}`,
        UserData: `${COGNITO_AUTH_PREFIX_KEY}.${lastAuthUser}.${CookieAuth.USER_DATA}`,
        RandomPassword: `${COGNITO_AUTH_PREFIX_KEY}.${lastAuthUser}.${CookieAuth.RANDOM_PASSWORD}`,
        DeviceKey: `${COGNITO_AUTH_PREFIX_KEY}.${lastAuthUser}.${CookieAuth.DEVICE_KEY}`
    };
    const userDataStr = cookies[cookieKeys.UserData];
    const userData = userDataStr !== undefined ? JSON.parse(userDataStr) as UserData: undefined;

    console.log(userData);
    const userInfo: UserInfo = {}
    if(userData) {
        for(let index = 0; index < userData?.UserAttributes.length; index++) {
            const attributeName = userData.UserAttributes[index].Name;
            const attributeValue = userData.UserAttributes[index].Value;
            if(attributeName == "sub") {
                userInfo.sub = attributeValue
            } else if(attributeName == "name") {
                userInfo.name = attributeValue
            } else if(attributeName == "email") {
                userInfo.email = attributeValue
            } else if(attributeName == "family_name") {
                userInfo.family_name = attributeValue
            } else if(attributeName == "given_name") {
                userInfo.given_name = attributeValue
            }
        }
    }

    return {
        AccessToken: cookies[cookieKeys.AccessToken],
        IdToken: cookies[cookieKeys.IdToken],
        ClockDrift: cookies[cookieKeys.ClockDrift],
        RefreshToken: cookies[cookieKeys.RefreshToken],
        DeviceGroupKey: cookies[cookieKeys.DeviceGroupKey],
        UserData: userData ? userInfo : undefined,
        RandomPassword: cookies[cookieKeys.RandomPassword],
        DeviceKey: cookies[cookieKeys.DeviceKey]
    };
}

export function SecureServerRoute(userToProps?: (user: CognitoUser) => {[key: string]: any}): GetServerSideProps {
    return async (context) => {
        return new Promise<any>((resolve, reject) => {
            const SSR = withSSRContext(context);
            SSR.Auth.currentAuthenticatedUser().then((user: CognitoUser) => {
                resolve({
                    props: userToProps ? userToProps(user) : {}
                });
            }).catch(err => {
                resolve({
                    redirect: {
                        destination: `${Routes.SignIn}?redirect_uri=${decodeURIComponent(context.resolvedUrl)}`,
                        permanent: false
                    }
                });
            });
        });
    }
}

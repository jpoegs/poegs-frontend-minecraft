/* eslint-disable */
// WARNING: DO NOT EDIT. This file is automatically generated by AWS Amplify. It will be overwritten.

const awsmobile = {
    "aws_project_region": process.env.NEXT_PUBLIC_USER_POOL_REGION,
    "aws_cognito_region": process.env.NEXT_PUBLIC_USER_POOL_REGION,
    "aws_user_pools_id": process.env.NEXT_PUBLIC_USER_POOL_ID,
    "aws_user_pools_web_client_id": process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    "oauth": {
        "scope": [
            "email",
            "openid",
            "phone",
            "profile",
            "aws.cognito.signin.user.admin"
        ],
        "redirectSignIn": `${process.env.NEXT_PUBLIC_HTTP_PROTOCOL}://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}${process.env.NEXT_PUBLIC_STAGE === 'development' ? `:${process.env.NEXT_PUBLIC_PORT}` : ''}/token`,
        "redirectSignOut": `${process.env.NEXT_PUBLIC_HTTP_PROTOCOL}://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}${process.env.NEXT_PUBLIC_STAGE === 'development' ? `:${process.env.NEXT_PUBLIC_PORT}` : ''}`,
        "responseType": "code",
        "domain": process.env.NEXT_PUBLIC_OAUTH_DOMAIN
    },
    "cookieStorage": {
        "domain": process.env.NEXT_PUBLIC_HOST,
        "path": "/",
        "expires": 30,
        "secure": process.env.NEXT_PUBLIC_STAGE === "prod",
        "sameSite": "strict"
    },
    "federationTarget": "COGNITO_USER_POOLS"
};

export default awsmobile;
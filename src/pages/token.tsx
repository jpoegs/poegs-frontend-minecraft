import React, {useEffect} from "react";
import { useRouter } from "next/router";
import {Grid, Typography, useTheme} from "@mui/material";
import querystring from "querystring";
import Routes from "../lib/Routes";
import {Auth, CognitoUser} from "@aws-amplify/auth";

function urlSafeDecode(hex: string): string {
    const matches = hex.match(/.{2}/g)
    if(matches == null) {
        return "";
    }
    return matches
        .map(char => String.fromCharCode(parseInt(char, 16)))
        .join('');
}

function decodeCustomState(state: string): string | null {
    if(state.includes("-")) {
        const [randomString, customState] = state.split("-");
        return urlSafeDecode(customState);
    } else {
        return null;
    }
}

function parseRedirectUri(queryString: string, defaultRedirectUri: string): string {
    const queryParams = querystring.decode(queryString);
    const state = queryParams["state"];

    if(state) {
        if(typeof(state) === "string") {
            const stateString = (state as string);
            const customState = decodeCustomState(stateString);
            return customState || defaultRedirectUri;
        } else {
            const stateStringArray = (state as string[]);

            const customState = stateStringArray.reduce((parsedCustomState, stateString, index, array) => {
                const decodedCustomState = decodeCustomState(stateString);
                if(parsedCustomState === "") {
                    return decodedCustomState || "";
                } else {
                    return parsedCustomState;
                }
            }, "");

            return customState || defaultRedirectUri;
        }
    } else {
        return defaultRedirectUri;
    }
}

export default function Token({query}) {
    const theme = useTheme();
    const router = useRouter();

    useEffect(() => {
        const redirectUri = parseRedirectUri(window.location.search.startsWith("?") ? window.location.search.substring(1): window.location.search, Routes.Profile);
        Auth.currentAuthenticatedUser().then((user: CognitoUser) => {
            console.log(`Redirecting to ${redirectUri}`);
            router.replace(redirectUri);
        }).catch(err => {
            console.error(err);
        });
    }, []);

    return (
        <Grid
            container
            spacing={0}
            alignContent="center"
            alignItems="center"
            justifyContent="center"
            style={{minHeight: '100vh'}}
        >
            <Grid item style={{backgroundColor: theme.palette.background.paper, padding: "100px 10px"}}>
                <Typography>Successfully Signed In with Google</Typography>
            </Grid>
        </Grid>
    );
}
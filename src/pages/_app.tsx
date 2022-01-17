import Amplify from 'aws-amplify';
import config from '../aws-exports'
import Head from "next/head";
import { ThemeProvider, Theme, StyledEngineProvider, adaptV4Theme } from '@mui/material/styles';
import {createTheme, CssBaseline, useMediaQuery} from "@mui/material";
import React from 'react';


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}


// Amplify.Logger.LOG_LEVEL = 'DEBUG';

Amplify.configure({
    ...config,
    ssr: true
});

export default function App({Component, pageProps}) {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

    const theme = React.useMemo(
        () =>
            createTheme(adaptV4Theme({
                palette: {
                    mode: prefersDarkMode ? 'dark': 'light'
                }
            })),
        [prefersDarkMode]
    );

    return (
        <React.Fragment>
            <Head>
                <title>Poegs Accounts</title>
                <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width"/>
            </Head>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={theme}>
                    <CssBaseline/>
                    <Component {...pageProps} />
                </ThemeProvider>
            </StyledEngineProvider>
        </React.Fragment>
    );
}

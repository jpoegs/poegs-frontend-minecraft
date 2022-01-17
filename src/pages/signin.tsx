import React, {useEffect, useState} from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
// import CircularProgress from "@mui/material/CircularProgress/CircularProgress";
import {CircularProgress} from "@mui/material";
import Link from "next/link"
import {Box, Chip, useTheme} from "@mui/material";
import {useRouter} from "next/router";
import {Auth} from "@aws-amplify/auth";
import {CognitoUser} from "amazon-cognito-identity-js";
import {ICredentials} from "aws-amplify/lib/Common/types/types";
import Image from 'next/image'
import {CognitoHostedUIIdentityProvider} from "@aws-amplify/auth";
import querystring from "querystring";
import Routes from "../lib/Routes";

const useStyles = makeStyles(theme => ({
    paper: {
        display: 'flex',
        justify: 'center',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%',
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: '#fff',
    }
}));

enum SignInState {
    PASSWORD,
    TOTP
}

export default function SignIn() {
    const classes = useStyles();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [signInState, setSignInState] = useState(SignInState.PASSWORD);
    const [user, setUser] = useState<CognitoUser | undefined>(undefined);
    const [redirectUri, setRedirectUri] = useState("/profile");
    const [isLoading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        const queryString = window.location.search.startsWith("?") ? window.location.search.substring(1): window.location.search;
        const queryParams = querystring.decode(queryString);

        const redirectParam = decodeURIComponent(queryParams["redirect_uri"] ? queryParams["redirect_uri"] as string : "");
        if(redirectParam && redirectParam !== "") {
            console.log(redirectParam);
            setRedirectUri(redirectParam);
        }
    }, []);

    const passwordForm = (
        <form className={classes.form} noValidate>
            <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                color="primary"
                autoFocus
                onChange={(event): void => setEmail(event.target.value)}
                error={errorMsg !== ''}
            />
            <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                color="primary"
                autoComplete="current-password"
                onChange={(event): void => setPassword(event.target.value)}
                helperText={errorMsg}
                error={errorMsg !== ''}
            />
            <FormControlLabel
                control={<Checkbox value="remember" color="primary" onChange={(event, checked): void => {setRememberMe(checked)}}/>}
                label="Remember me"
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                onClick={(event) => {
                    event.preventDefault()
                    if(!isLoading) {
                        setErrorMsg("");
                        Auth.signIn(email, password).then((user: CognitoUser) => {
                            setUser(user);
                            if((user as any).challengeName === "SOFTWARE_TOKEN_MFA") {
                                setSignInState(SignInState.TOTP);
                            } else {
                                console.log("Successfully signed in.");
                                if (rememberMe) {
                                    user.getCachedDeviceKeyAndPassword();
                                    user.setDeviceStatusRemembered({
                                        onSuccess: (success: string) => {
                                            console.log("Device successfully remembered.");
                                            router.push(redirectUri);
                                        },
                                        onFailure: (err) => {
                                            console.log(err);
                                            router.push(redirectUri);
                                        }
                                    });
                                } else {
                                    router.push(redirectUri);
                                }
                            }
                        }).catch(err => {
                            console.log(err);
                            setLoading(false);
                            setErrorMsg(err.message);
                        });
                    }
                }}
            >
                {isLoading ? <CircularProgress color="inherit"/> : "Sign In"}
            </Button>
            <Grid container
                  direction="row"
                  alignContent="space-between"
                  alignItems="center"
                  spacing={1}>
                <Grid item xs={12}>
                    <Box display="flex" justifyContent={"center"}>
                        <Typography component="h1" variant="h5">OR</Typography>
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Box display="flex" justifyContent={"center"}>
                        <Chip icon={<div style={{marginTop: "5px"}}><Image src={"/GoogleLogo.svg"} width={"25"} height={"25"} /></div>} label="Sign In with Google" onClick={(event)=>{
                            Auth.federatedSignIn({provider: CognitoHostedUIIdentityProvider.Google, customState: redirectUri}).then((creds: ICredentials) => {
                                console.log("Successfully logged in with Google.");
                            }).catch(err => {
                                console.error(err);
                            });
                        }} />
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Link href={'/'} passHref>
                        <a style={{color: theme.palette.text.primary}}>Forgot password?</a>
                    </Link>
                </Grid>
                <Grid item xs={6}>
                    <Box display="flex" flexDirection={"row-reverse"}>
                        <Link href={'/signup'} passHref>
                            <a style={{color: theme.palette.text.primary}}>Don't have an account? Sign Up</a>
                        </Link>
                    </Box>
                </Grid>
            </Grid>
        </form>
    );

    const totpForm = (
        <form className={classes.form} noValidate>
            <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="totpCode"
                label="Totp Code"
                name="totpCode"
                type="text"
                autoFocus
                defaultValue={""}
                onChange={(event): void => setCode(event.target.value)}
                helperText={errorMsg}
                error={errorMsg !== ''}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                onClick={(event) => {
                    event.preventDefault()
                    if(!isLoading) {
                        setErrorMsg("");
                        Auth.confirmSignIn(user, code, "SOFTWARE_TOKEN_MFA").then((user: CognitoUser) => {
                            console.log("Successfully signed in.")
                            if(rememberMe) {
                                user?.setDeviceStatusRemembered({
                                    onSuccess: (success: string) => {
                                        console.log("Device successfully remembered.");
                                        router.push(redirectUri);
                                    },
                                    onFailure: (err) => {
                                        console.log(err);
                                        router.push(redirectUri);
                                    }
                                });
                            } else {
                                router.push(redirectUri);
                            }
                        }).catch(err => {
                            console.log(err.message);
                            setLoading(false);
                            setErrorMsg(err.message);
                        });
                    }
                }}
            >
                {isLoading ? <CircularProgress color="inherit"/> : "Submit Code"}
            </Button>
            <Grid container>
                <Grid item xs>
                    <Link href={Routes.SignIn} passHref>
                        <a style={{color: theme.palette.text.primary}} onClick={(event) => setSignInState(SignInState.PASSWORD)}>Back</a>
                    </Link>
                </Grid>
            </Grid>
        </form>
    );

    let form = signInState === SignInState.PASSWORD ? passwordForm : totpForm;

    return (
        <Grid
            container
            spacing={0}
            alignContent="center"
            alignItems="center"
            justifyContent="center"
            style={{ minHeight: '100vh' }}
        >
            <Grid item>
                <CssBaseline/>
                <div className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <LockOutlinedIcon/>
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign In
                    </Typography>
                    {form}
                </div>
            </Grid>
        </Grid>
    );
};
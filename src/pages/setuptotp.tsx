import {useEffect, useState} from "react";
import {
    Avatar,
    Backdrop,
    Button,
    CircularProgress,
    Grid,
    TextField,
    Typography,
    useTheme
} from "@mui/material";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import makeStyles from '@mui/styles/makeStyles';
import React from "react";
import Link from "next/link";
import {Auth, CognitoUser} from "@aws-amplify/auth";
import {useRouter} from "next/router";
import {GetServerSideProps} from "next";
import {withSSRContext} from "aws-amplify";
import QRCode from "qrcode.react";
import {CognitoUserSession} from "amazon-cognito-identity-js";
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

export const getServerSideProps: GetServerSideProps = async (context) => {
    return new Promise<any>((resolve, reject) => {
        const SSR = withSSRContext(context);
        SSR.Auth.currentAuthenticatedUser().then((user: CognitoUser) => {
            user.getUserAttributes((err, userAttributes) => {
                let email = "";

                if(!err && userAttributes) {
                    for(let index = 0; index < userAttributes.length; index++) {
                        let att = userAttributes[index];
                        let attName = att.getName();
                        let attValue = att.getValue();

                        if(attName == "email") {
                            email = attValue;
                        }
                    }
                } else {
                    resolve({
                        redirect: {
                            destination: Routes.SignIn,
                            permanent: false
                        },
                    });
                }
                resolve({
                    props: {
                        beforeEmail: email
                    }
                });

            });
        }).catch(err => {
            resolve({
                redirect: {
                    destination: Routes.SignIn,
                    permanent: false
                },
            });
        });
    });
}

export default function SetupTotp({email}: {email: string}) {
    const classes = useStyles();

    const [user, setUser] = useState<CognitoUser | undefined>(undefined)
    const [totpString, setTotpString] = useState<string>("");
    const [code, setCode] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        Auth.currentAuthenticatedUser().then((user: CognitoUser) => {
            if (user) {
                setUser(user);
                Auth.setupTOTP(user).then((totpCode: string) => {
                    console.log(totpCode);
                    setTotpString(totpCode);
                }).catch(err => {
                    console.error(err);
                    setErrorMsg(err.message);
                });
            }
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
            <Grid item>
                <div className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <LockOutlinedIcon/>
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Setup Totp
                    </Typography>
                    <QRCode
                        id="totpQrCode"
                        value={`otpauth://totp/Poegs:${email}?secret=${totpString}&issuer=Poegs`}
                        size={250}
                        level={"H"}
                        includeMargin={true}
                        renderAs="svg"
                        bgColor={theme.palette.background.default}
                        fgColor={theme.palette.text.primary}
                    />
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
                            onChange={(event): void => setCode(event.target.value)}
                            helperText={errorMsg}
                            error={errorMsg !== ''}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            className={classes.submit}
                            onClick={(event) => {
                                event.preventDefault();
                                if (!isLoading) {
                                    setIsLoading(true);
                                    Auth.verifyTotpToken(user, code).then((userSession: CognitoUserSession) => {
                                        console.log("Successfully verified totp token.");
                                        user?.setUserMfaPreference(null, {PreferredMfa: true, Enabled: true},
                                            (err?: Error, result?: string) => {
                                            if (err) {
                                                console.error(err);
                                            } else {
                                                console.log(result);
                                                router.push(Routes.Profile);
                                            }
                                        });
                                    }).catch(err => {
                                        console.error(err);
                                        setErrorMsg(err.message);
                                        setIsLoading(false);
                                    });
                                }
                            }}
                        >
                            Verify Code
                        </Button>
                        <Grid container>
                            <Grid item xs>
                                <Link href={Routes.Profile} passHref>
                                    <a style={{color: theme.palette.text.primary}}>Back to Profile</a>
                                </Link>
                            </Grid>
                        </Grid>

                        <Backdrop className={classes.backdrop} open={isLoading}>
                            <CircularProgress color="inherit"/>
                        </Backdrop>
                    </form>
                </div>
            </Grid>
        </Grid>
    );
}
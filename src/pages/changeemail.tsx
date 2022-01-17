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
                            destination: '/signin',
                            permanent: false
                        }
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
                    destination: '/signin',
                    permanent: false
                }
            });
        });
    });
}

export default function ChangeEmail({beforeEmail}: {beforeEmail: string}) {
    const classes = useStyles();

    const [user, setUser] = useState<CognitoUser | undefined>( undefined)
    const [email, setEmail] = useState<string>(beforeEmail);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const router = useRouter();
    const theme = useTheme();

    useEffect(()=> {
        Auth.currentAuthenticatedUser().then((user: CognitoUser) => {
            if(user) {
                setUser(user);
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
            style={{ minHeight: '100vh' }}
        >
            <Grid item>
                <div className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <LockOutlinedIcon/>
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Change Email
                    </Typography>
                    <form className={classes.form} noValidate>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email"
                            type="text"
                            name="email"
                            autoFocus
                            defaultValue={email}
                            onChange={(event): void => setEmail(event.target.value)}
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
                                if(!isLoading) {
                                    setIsLoading(true)
                                    Auth.updateUserAttributes(user, {"email": email}).then((success => {
                                        console.log("Successfully changed email.");
                                        router.push("/profile");
                                    })).catch(err => {
                                        setErrorMsg(err.message);
                                        console.log(err);
                                        setIsLoading(false);
                                    });
                                }
                            }}
                        >
                            Change Email
                        </Button>
                        <Grid container>
                            <Grid item xs>
                                <Link href={'/profile'} passHref>
                                    <a style={{color: theme.palette.primary.contrastText}}>Back to Profile</a>
                                </Link>
                            </Grid>
                        </Grid>

                        <Backdrop className={classes.backdrop} open={isLoading}>
                            <CircularProgress color="inherit" />
                        </Backdrop>
                    </form>
                </div>
            </Grid>
        </Grid>
    );
}
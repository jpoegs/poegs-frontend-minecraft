import React, {useState} from 'react';
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
import {ISignUpResult} from 'amazon-cognito-identity-js';
import Link from 'next/link';
import {useRouter} from "next/router";
import {Auth, AuthErrorStrings, CognitoHostedUIIdentityProvider} from "@aws-amplify/auth";
import {Box, Chip, useTheme} from "@mui/material";
import Routes from "../lib/Routes";
import Image from "next/image";
import {ICredentials} from "aws-amplify/lib/Common/types/types";

const useStyles = makeStyles(theme => ({
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
}));

export default function SignUp() {

    const classes = useStyles();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [signUpResult, setSignUpResult] = useState<ISignUpResult | null>(null);

    const router = useRouter();
    const theme = useTheme();

    let form;
    if(signUpResult != null) {
        form = {};
    } else {
        form = (
            <form className={classes.form} noValidate>
                <Grid container>
                    <Grid item xs={12}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            onChange={(event): void => setEmail(event.target.value)}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="firstName"
                            label="First Name"
                            name="firstName"
                            autoComplete="given-name"
                            autoFocus
                            onChange={(event): void => setFirstName(event.target.value)}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="lastName"
                            label="Last Name"
                            name="lastName"
                            autoComplete="family-name"
                            autoFocus
                            onChange={(event): void => setLastName(event.target.value)}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            onChange={(event): void => setPassword(event.target.value)}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            onChange={(event): void => setConfirmPassword(event.target.value)}
                        />
                    </Grid>
                </Grid>
                <FormControlLabel
                    control={<Checkbox value="remember" color="primary"/>}
                    label="Remember me"
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    className={classes.submit}
                    onClick={async (event) => {
                        event.preventDefault();
                        if(!isLoading) {
                            if(password !== confirmPassword) {
                                setErrorMsg("Password and confirm password must be equal");
                                return;
                            } else if(password === "") {
                                setErrorMsg(AuthErrorStrings.EMPTY_PASSWORD)
                                return;
                            }
                            setErrorMsg('');
                            setLoading(true);
                            Auth.signUp({username: email, password: password, attributes: {given_name: firstName, family_name: lastName}}).then((res: ISignUpResult) => {
                                setSignUpResult(res);
                            }).catch((err: any) => {
                                setErrorMsg(err);
                                setLoading(false);
                            });
                        }
                    }}
                >
                    Sign Up
                </Button>
                <Grid container
                      direction="row"
                      alignContent="space-between"
                      alignItems="center"
                      spacing={1}
                >
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent={"center"}>
                                <Typography component="h1" variant="h5">OR</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent={"center"}>
                                <Chip icon={<div style={{marginTop: "5px"}}><Image src={"/GoogleLogo.svg"} width={"25"} height={"25"} /></div>} label="Sign Up with Google" onClick={(event)=>{
                                    Auth.federatedSignIn({provider: CognitoHostedUIIdentityProvider.Google}).then((creds: ICredentials) => {
                                        console.log("Successfully logged in with Google.");
                                    }).catch(err => {
                                        console.error(err);
                                    });
                                }} />
                            </Box>
                        </Grid>
                    <Grid item xs>
                        <Link href={Routes.SignIn} passHref>
                            <a style={{color: theme.palette.text.primary}}>Already have an account? Sign In</a>
                        </Link>
                    </Grid>
                </Grid>
            </form>
        )
    }

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
                        Sign Up
                    </Typography>
                    {form}
                </div>
            </Grid>
        </Grid>
    );
}
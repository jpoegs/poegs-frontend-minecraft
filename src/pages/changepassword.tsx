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
import {SecureServerRoute} from "../auth/AuthHelper";

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

export const getServerSideProps: GetServerSideProps = SecureServerRoute();

export default function ChangePassword() {
    const classes = useStyles();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newConfirmPassword, setNewConfirmPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [user, setUser] = useState<CognitoUser | undefined>(undefined);

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
                        Change Password
                    </Typography>
                    <form className={classes.form} noValidate>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="password"
                            label="Current Password"
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            autoFocus
                            onChange={(event): void => setCurrentPassword(event.target.value)}
                            error={errorMsg !== ''}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="newPassword"
                            label="New Password"
                            type="password"
                            id="newPassword"
                            autoComplete="new-password"
                            onChange={(event): void => setNewPassword(event.target.value)}
                            helperText={errorMsg}
                            error={errorMsg !== ''}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="newConfirmPassword"
                            label="Confirm Password"
                            type="password"
                            id="newConfirmPassword"
                            autoComplete="new-password"
                            onChange={(event): void => setNewConfirmPassword(event.target.value)}
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
                                    if(newPassword === newConfirmPassword) {
                                        setIsLoading(true)
                                        Auth.changePassword(user, currentPassword, newConfirmPassword).then((success => {
                                            console.log("Successfully changed password.");
                                            router.push("/profile");
                                        })).catch(err => {
                                            setErrorMsg(err.message);
                                            console.log(err);
                                            setIsLoading(false);
                                        });
                                    } else {
                                        setErrorMsg("Passwords do not match.");
                                    }
                                }
                            }}
                        >
                            Change Password
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
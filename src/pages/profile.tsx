import {GetServerSideProps} from "next";
import {Auth, CognitoUser} from "@aws-amplify/auth";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {
    Box,
    Button,
    Container,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    ListSubheader,
    Switch,
    Theme,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import {ChevronRight, VerifiedUser, Close, Delete} from "@mui/icons-material";
import {UserData} from "amazon-cognito-identity-js";
import {SecureServerRoute, WEB_AUTHN} from "../auth/AuthHelper";
import axios from "axios";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
            padding: '4vh',
            backgroundColor: theme.palette.background.paper,
        },
        nested: {
            paddingLeft: theme.spacing(4),
        },
    }),
);

export const getServerSideProps: GetServerSideProps = SecureServerRoute()

type MFA = "NOMFA" | "SOFTWARE_TOKEN_MFA";
export interface FederatedIdentity {
    userId?: string;
    providerName?: string;
    providerType?: string;
    issuer?: string;
    primary?: boolean;
    dateCreated?: number;
}

function toTimeFromString(date: Date) {
    const now = new Date();

    const fromAgo = (now.valueOf() - date.valueOf()) / 1000;
    if(fromAgo < 60) {
        return `${Math.floor(fromAgo)} seconds ago`;
    } else if(fromAgo < 3600) {
        return `${Math.floor(fromAgo / 60)} minutes ago`;
    } else if(fromAgo < 86400) {
        return `${Math.floor(fromAgo / 3600)} hours ago`;
    } else if(fromAgo < 31536000) {
        return `${Math.floor(fromAgo / 86400)} days ago`;
    } else {
        return `${Math.floor(fromAgo / 31536000)} years ago`;
    }
}

export default function Profile() {
    const [user, setUser] = useState<CognitoUser | undefined>(undefined);
    const [firstName, setFirstName] = useState<string | undefined>(undefined);
    const [lastName, setLastName] = useState<string | undefined>(undefined);
    const [email, setEmail] = useState<string | undefined>(undefined);
    const [emailVerified, setEmailVerified] = useState<boolean | undefined>(undefined);
    const [sub, setSub] = useState<string | undefined>(undefined);
    const [mfas, setMFAs] = useState<MFA[]>([]);
    const [preferredMFA, setPreferredMFA] = useState<MFA>("NOMFA");
    const [identities, setIdentities] = useState<FederatedIdentity[]>([]);
    const [devices, setDevices] = useState([]);

    const classes = useStyles();
    const router = useRouter();
    const theme = useTheme();

    useEffect(()=> {
        Auth.currentAuthenticatedUser().then((user: CognitoUser) => {
            if(user) {
                setUser(user);

                user.getUserAttributes((err, userAttributes) => {
                    if(!err && userAttributes) {
                        console.log(userAttributes)
                        for(let index = 0; index < userAttributes.length; index++) {
                            let att = userAttributes[index];
                            let attName = att.getName();
                            let attValue = att.getValue();

                            if(attName == "given_name") {
                                setFirstName(attValue);
                            } else if(attName == "family_name") {
                                setLastName(attValue);
                            } else if(attName == "email") {
                                setEmail(attValue);
                            } else if (attName == "email_verified") {
                                setEmailVerified(attValue.toLowerCase() === "true");
                            } else if (attName == "identities") {
                                try {
                                    const fi = JSON.parse(attValue);
                                    setIdentities(fi as FederatedIdentity[]);
                                } catch {
                                    console.error("Unable to parse identities.");
                                }
                            } else if (attName == "sub") {
                                setSub(attValue);
                            }
                        }
                    }
                });

                user.listDevices(10, null, {
                    onSuccess: (data: any) => {
                        setDevices(data.Devices);
                    },
                    onFailure: err => {
                        console.error(err);
                    }
                });

                user.getUserData((err?: Error, result?: UserData) => {
                    if(err) {
                        console.error(err);
                    } else {
                        if(result?.PreferredMfaSetting) {
                            setPreferredMFA(result?.PreferredMfaSetting as MFA);
                        }

                        if(result?.UserMFASettingList) {
                            setMFAs(result?.UserMFASettingList as MFA[]);
                        }
                    }
                });
            }
        });
    }, []);

    const federatedProviders = identities.map((identity => {
        return identity.providerName;
    }));

    const devicesList: any[] = [];
    devices.forEach((device: any, index: number) => {
        const deviceCreateDate = device.DeviceCreateDate;
        const deviceKey = device.DeviceKey;
        const deviceLastAuthenticatedDate = new Date(device.DeviceLastAuthenticatedDate * 1000);
        const deviceLastModifiedDate = device.DeviceLastModifiedDate;

        let deviceName = "";
        let lastIpUsed = "";
        let deviceStatus = "";

        device.DeviceAttributes.forEach((deviceAttribute: any) => {
            const deviceAttName = deviceAttribute.Name;
            const deviceAttValue = deviceAttribute.Value;

            if(deviceAttName === "device_name") {
                deviceName = deviceAttValue;
            } else if(deviceAttName === "last_ip_used") {
                lastIpUsed = deviceAttValue;
            } else if(deviceAttName === "device_status") {
                deviceStatus = deviceAttValue;
            }
        });

        devicesList.push(
            <ListItem key={deviceKey}>
                <ListItemText primary={
                    <Tooltip title={deviceName}>
                        <Typography style={{textOverflow: "ellipsis", fontSize: "0.875rem"}} noWrap>
                            {deviceName}
                        </Typography>
                    </Tooltip>} secondary={
                              <Typography style={{textOverflow: "ellipsis", fontSize: "0.875rem", color: theme.palette.text.secondary}} noWrap>
                                  <span>{lastIpUsed}</span><span style={{margin: "0 20px"}}>|</span><Tooltip title={deviceLastAuthenticatedDate.toLocaleString()}><span>{toTimeFromString(deviceLastAuthenticatedDate)}</span></Tooltip>
                              </Typography>}
                />
                <ListItemSecondaryAction>
                    <Tooltip title={"Remove Device"}>
                        <IconButton
                            edge="end"
                            aria-label="update"
                            onClick={
                                () => {
                                    user?.forgetSpecificDevice(deviceKey, {
                                        onSuccess: (success: string) => {
                                            console.log("Successfully removed remembered device.")
                                            setDevices(devices.filter((device: any) => {
                                                return device.DeviceKey !== deviceKey;
                                            }));
                                        },
                                        onFailure: err => {
                                            console.error(err);
                                        }
                                    })
                                }
                            }
                            size="large">
                            <Delete fontSize={"large"} />
                        </IconButton>
                    </Tooltip>
                </ListItemSecondaryAction>
            </ListItem>
        );

        if(index < devices.length - 1) {
            devicesList.push(<Divider key={`${deviceKey}-divider`}/>);
        }
    });

    return (
        <Container component="main" maxWidth="md">
            <Grid
                container
                direction={"column"}
                alignContent="center"
                alignItems="center"
                justifyContent="center"
                style={{ minHeight: '100vh'}}
            >
                <Box
                    border={1}
                    borderRadius="4px"
                    style={{ width: '100%', backgroundColor: theme.palette.background.paper}}
                >
                    <Grid
                        container
                        spacing={0}
                        direction={"column"}
                        alignContent="center"
                        alignItems="center"
                        justifyContent="center"
                        style={{ padding: '4vh' }}
                    >
                        <List
                            aria-labelledby="nested-list-subheader"
                            subheader={
                                <ListSubheader component="div" id="nested-list-subheader">
                                    Profile
                                </ListSubheader>
                            }
                            className={classes.root}
                            dense={true}
                        >
                            <ListItem>
                                <ListItemText primary="Name" secondary={`${firstName} ${lastName}`}/>
                                <ListItemSecondaryAction>
                                    <Tooltip title="Update Name">
                                        <IconButton
                                            edge="end"
                                            aria-label="update"
                                            disabled={federatedProviders.includes("Google")}
                                            onClick={()=>{router.push("/changename")}}
                                            size="large">
                                            <ChevronRight fontSize={"large"} />
                                        </IconButton>
                                    </Tooltip>
                                </ListItemSecondaryAction>
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Email" secondary={email} />
                                <ListItemIcon>
                                    {emailVerified === true ?
                                        <Tooltip title="Verified"><VerifiedUser/></Tooltip>:
                                        <Tooltip title="Not Verified"><IconButton onClick={() => {router.push("/verifyemail")}} size="large"><Close color={"error"}/></IconButton></Tooltip>
                                    }
                                </ListItemIcon>
                                <ListItemSecondaryAction>
                                    <Tooltip title="Update Email">
                                        <IconButton
                                            edge="end"
                                            aria-label="update"
                                            disabled={federatedProviders.includes("Google")}
                                            onClick={()=>{router.push("/changeemail")}}
                                            size="large">
                                            <ChevronRight fontSize={"large"} />
                                        </IconButton>
                                    </Tooltip>
                                </ListItemSecondaryAction>
                            </ListItem>
                            {federatedProviders.includes("Google") ?
                                <ListItem>
                                    <ListItemText primary="Linked Accounts" secondary="Google"/>
                                </ListItem> : undefined
                            }
                            {!federatedProviders.includes("Google") ?
                                <ListItem>
                                    <ListItemText primary="Password" secondary="**********"/>
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Update Password">
                                            <IconButton
                                                edge="end"
                                                aria-label="update"
                                                onClick={() => {
                                                    router.push("/changepassword")
                                                }}
                                                size="large">
                                                <ChevronRight fontSize={"large"}/>
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>: undefined
                            }
                            {!federatedProviders.includes("Google") ?
                                <ListItem>
                                    <ListItemText primary="Authenticator App" secondary={mfas.includes("SOFTWARE_TOKEN_MFA") ? "Configured": "Not Set"} />
                                    <ListItemSecondaryAction>
                                        <Tooltip title={mfas.includes("SOFTWARE_TOKEN_MFA") ? "Disable MFA" : "Enable MFA"}>
                                            <Switch checked={mfas.includes("SOFTWARE_TOKEN_MFA")} color="primary" onChange={(event, checked) => {
                                                if(checked) {
                                                    router.push("/setuptotp");
                                                } else {
                                                    router.push("/disabletotp")
                                                }
                                            }}/>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>: undefined
                            }
                            {!federatedProviders.includes("Google") ?
                                <ListItem>
                                    <ListItemText primary="WebAuthN" secondary="Not Set"/>
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Register Hardware Token">
                                            <IconButton
                                                edge="end"
                                                aria-label="update"
                                                onClick={() => {
                                                    window.navigator.credentials.create({
                                                        publicKey: {
                                                            attestation: "direct",
                                                            challenge: new TextEncoder().encode("asdasdasdasdasd"),
                                                            pubKeyCredParams: [{
                                                                // Algorithm ES256
                                                                type: 'public-key', alg: -7
                                                            }] as PublicKeyCredentialParameters[],
                                                            rp: {
                                                                id: WEB_AUTHN.RP_ID,
                                                                name: "Poegs"
                                                            } as PublicKeyCredentialRpEntity,
                                                            timeout: 30000,
                                                            user: {
                                                                displayName: `${firstName} ${lastName}`,
                                                                id: new TextEncoder().encode(sub),
                                                                name: email
                                                            } as PublicKeyCredentialUserEntity,
                                                        } as PublicKeyCredentialCreationOptions
                                                    }).then((cred: Credential | null) => {
                                                        console.log(cred);
                                                        axios.post("https://v1x64ch9jj.execute-api.us-west-2.amazonaws.com/prod", cred).then(res => {
                                                            console.log(res);
                                                        }).catch(err => {
                                                            console.error("");
                                                        });
                                                    }).catch(err => {
                                                         console.error(err);
                                                    });
                                                }}
                                                size="large">
                                                <ChevronRight fontSize={"large"}/>
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>: undefined
                            }
                            </List>
                            {!federatedProviders.includes("Google") ? <Divider /> : undefined}
                            {!federatedProviders.includes("Google") ?
                                <List component="nav" aria-label="secondary device list"
                                    subheader={
                                        <ListSubheader component="div" id="nested-list-subheader">
                                            Devices
                                        </ListSubheader>
                                    }
                                    className={classes.root} dense={true}>
                                    {devicesList}
                                </List>: undefined
                            }
                        <Button
                            type="submit"
                            variant="contained"
                            onClick={(event) => {
                                Auth.signOut().finally(() => {
                                    router.push("/signin");
                                });
                            }}
                        >
                            SignOut
                        </Button>
                    </Grid>
                </Box>
            </Grid>
        </Container>
    );
}
import {GetServerSideProps} from "next";
import {withSSRContext} from "aws-amplify";
import {CognitoUser} from "@aws-amplify/auth";

export const getServerSideProps: GetServerSideProps = async (context) => {
    return new Promise<any>((resolve, reject) => {
        const SSR = withSSRContext(context);
        SSR.Auth.currentAuthenticatedUser().then((user: CognitoUser) => {
            resolve({
                props: {
                    redirect: {
                        destination: '/profile',
                        permanent: false
                    }
                }
            })
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
export default function Home() {
    return (<div></div>);
}

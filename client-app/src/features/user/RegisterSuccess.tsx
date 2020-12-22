import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import queryString from 'query-string';
import { Button, Header, Icon, Segment } from 'semantic-ui-react';
import agent from '../../app/api/agent';
import { toast } from 'react-toastify';

const RegisterSuccess: React.FC<RouteComponentProps> = ({ location }) => {
    const { email } = queryString.parse(location.search);

    const handleConfirmEmailResend = () => {
        agent.User.resendEmailVerification(email as string).then(() => {
            toast.success('Verification email was resent');
        }).catch((error) => console.log(error));
    }

    return (
        <Segment placeholder>
            <Header icon>
                <Icon name='check' />
                Succesfully Registered!
            </Header>

            <Segment.Inline>
                <div className="center">
                    <p>Please check your email for verification email</p>
                    {email &&
                        <>
                            <p>Didnt receive email? Please click below button to resend</p>
                            <Button onClick={handleConfirmEmailResend} primary content='Resend Email' size='huge'></Button>
                        </>
                    }
                </div>
            </Segment.Inline>
        </Segment>
    )
}

export default RegisterSuccess;
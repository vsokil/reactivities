import React from 'react'
import { Menu, Container, Button } from 'semantic-ui-react'

const NavBar = () => {
    return (
        <div>
            <Menu fixed='top' inverted>
                <Container>
                    <Menu.Item>
                        <img src="/assets/logo.png" alt="logo" style={{ marginRight: 10 }} />
                        Reactivities
                    </Menu.Item>
                    <Menu.Item name='Activities' />
                    <Menu.Item>
                        <Button positive content='Create Activity' />
                    </Menu.Item>
                </Container>
            </Menu>
        </div>
    )
}

export default NavBar
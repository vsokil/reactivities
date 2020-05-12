import React, { useContext } from 'react'
import { Menu, Container, Button } from 'semantic-ui-react'
import ActivityStore from '../../app/stores/activityStore';

const NavBar: React.FC = () => {
    const activityStore = useContext(ActivityStore);
    
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
                        <Button onClick={() => activityStore.openCreateForm()} positive content='Create Activity' />
                    </Menu.Item>
                </Container>
            </Menu>
        </div>
    )
}

export default NavBar
import { useState, useEffect, MouseEvent } from 'react';
import { Container, ListGroup, Row } from 'reactstrap';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import Error from '../components/Error';
import Role from './Role';
import Logo from '../components/Logo';
import { RoundedContent, RoundedWrapper } from '../../constants/styles';

const SelectRoleHeader = styled.h4`
  margin-top: 15px;
  padding-top: 15px;
`;

interface RoleData {
  index: number;
  accountId: string;
  roleName: string;
  principalArn: string;
  roleArn: string;
}

function SelectRole() {
  const [displayAccountId, setDisplayAccountId] = useState(true);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const data = await window.electronAPI.getRoles();
      setRoles(data.roles);

      const uniqueAccountIds = new Set(data.roles.map((role) => role.accountId));
      if (uniqueAccountIds.size === 1) {
        setDisplayAccountId(false);
      }
    })();

    window.electronAPI.darkModeUpdated(() => {});
  }, []);

  const handleClick = (index: number) => async (event: MouseEvent) => {
    event.preventDefault();

    const data = await window.electronAPI.setRole({ index });
    if (data.error) {
      setError(data.error);
    } else if (data.status) {
      setStatus(data.status);
    }
  };

  if (status === 'selected') {
    return <Navigate to="/refresh" />;
  }

  return (
    <Container>
      <Row className="d-flex p-2">
        <RoundedWrapper>
          <Logo />
          <RoundedContent>
            <Error error={error} />
            <SelectRoleHeader>Select a role:</SelectRoleHeader>
            <ListGroup>
              {roles.map((role) => (
                <Role
                  accountId={role.accountId}
                  displayAccountId={displayAccountId}
                  key={`role-item-${role.index}`}
                  name={role.roleName}
                  onClick={handleClick(role.index)}
                />
              ))}
            </ListGroup>
          </RoundedContent>
        </RoundedWrapper>
      </Row>
    </Container>
  );
}

export default SelectRole;

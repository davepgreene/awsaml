import { ListGroupItem } from 'reactstrap';
import styled from 'styled-components';
import { BORDER_COLOR_SCHEME_MEDIA_QUERY } from '../../constants/styles';

const SelectRoleButton = styled(ListGroupItem)`
  cursor: pointer;
  background-color: transparent;
  ${BORDER_COLOR_SCHEME_MEDIA_QUERY}
  margin-right: 0.8em;
  padding-left: 0.5em;
  padding-right: 0.5em;
`;

interface RoleProps {
  accountId: string;
  displayAccountId: boolean;
  name: string;
  onClick: (event: React.MouseEvent) => void;
}

function Role({ displayAccountId, name, accountId, onClick }: RoleProps) {
  const displayName = displayAccountId ? `${accountId}:${name}` : name;

  return (
    <SelectRoleButton action onClick={onClick} tag="button">
      {displayName}
    </SelectRoleButton>
  );
}

export default Role;

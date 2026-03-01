import { useCallback } from 'react';
import styled from 'styled-components';
import { ListGroup } from 'reactstrap';
import update from 'immutability-helper';
import Login from './Login';

const ScrollableListGroup = styled(ListGroup)`
  overflow-x: hidden;
  height: 300px;
`;

interface MetadataUrl {
  url: string;
  name: string;
  profileUuid: string;
}

interface LoginListProps {
  filteredMetadataUrls: MetadataUrl[];
  deleteCallback: (payload: { profileUuid: string }) => void;
  reOrderCallback: (urls: MetadataUrl[]) => void;
  errorHandler: (error: string) => void;
  darkMode: boolean;
}

function LoginList({
  filteredMetadataUrls,
  deleteCallback,
  reOrderCallback,
  errorHandler,
  darkMode,
}: LoginListProps) {
  const moveLogin = useCallback((dragIndex: number, hoverIndex: number) => {
    if (dragIndex === undefined) return;

    const updatedMetadataUrls = update(filteredMetadataUrls, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, filteredMetadataUrls[dragIndex]],
      ],
    });

    reOrderCallback(updatedMetadataUrls);
  }, [filteredMetadataUrls, reOrderCallback]);

  return (
    <ScrollableListGroup>
      {filteredMetadataUrls.map(({ url, name, profileUuid }, index) => (
        <Login
          index={index}
          moveLogin={moveLogin}
          deleteCallback={deleteCallback}
          errorHandler={errorHandler}
          key={url}
          pretty={name}
          profileUuid={profileUuid}
          url={url}
          darkMode={darkMode}
        />
      ))}
    </ScrollableListGroup>
  );
}

export default LoginList;

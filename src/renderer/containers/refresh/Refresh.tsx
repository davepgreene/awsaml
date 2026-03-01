import { useState, useEffect, MouseEvent } from 'react';
import { Container, Row, Button, Collapse, Alert } from 'reactstrap';
import { Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import Error from '../components/Error';
import Logo from '../components/Logo';
import Credentials from './Credentials';
import Logout from './Logout';
import InputGroupWithCopyButton from '../components/InputGroupWithCopyButton';
import { RoundedContent, RoundedWrapper, DARK_MODE_AWARE_BORDERLESS_BUTTON } from '../../constants/styles';
import useInterval from '../../constants/hooks';

const EnvVar = styled(RoundedContent)`
  margin-top: 20px;
  margin-bottom: 20px;
  padding: 10px 20px;
`;

const DarkModeAwareCard = styled.div`
  @media (prefers-color-scheme: dark) { border-color: rgb(249, 249, 249); }
  @media (prefers-color-scheme: light) { border-color: #333; }
`;

const AccountProps = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  margin: 0;
  padding: .5rem;
`;

const AccountPropsKey = styled.dt`
  grid-column: 1;
  margin-right: .5rem;
`;

const AccountPropsVal = styled.dd`
  grid-column: 2;
  margin-bottom: 0;
`;

const PreInputGroupWithCopyButton = styled(InputGroupWithCopyButton)`
  font-family: Consolas,monospace;
  font-size: 1rem;
`;

const BorderlessButton = styled(Button)`
  ${DARK_MODE_AWARE_BORDERLESS_BUTTON}
`;

const getLang = (platform: string) => (platform === 'win32' ? 'language-batch' : 'language-bash');
const getTerm = (platform: string) => (platform === 'win32' ? 'command prompt' : 'terminal');
const getExport = (platform: string) => (platform === 'win32' ? 'set' : 'export');

const getEnvVars = ({ platform, accountId }: { platform: string; accountId: string }) => `
${getExport(platform)} AWS_PROFILE=awsaml-${accountId}
${getExport(platform)} AWS_DEFAULT_PROFILE=awsaml-${accountId}
`.trim();

const relativeDate = (date: string) => {
  const deltaSeconds = (new Date(date).getTime() - new Date().getTime()) / 1000;
  const relative: string[] = [];

  const hours = Math.floor(deltaSeconds / 3600);
  const minutes = Math.floor((deltaSeconds % 3600) / 60);
  const seconds = Math.floor(deltaSeconds % 60);

  if (hours) relative.push(`${hours}h`);
  relative.push(minutes ? `${minutes}m` : '0m');
  relative.push(seconds ? `${seconds}s` : '0s');

  return relative.join(' ');
};

interface CredentialsState {
  accessKey: string;
  secretKey: string;
  sessionToken: string;
  expiration: string;
}

function Refresh() {
  const [caretDirection, setCaretDirection] = useState<'right' | 'down'>('down');
  const [isOpen, setIsOpen] = useState(true);
  const [credentials, setCredentials] = useState<CredentialsState>({
    accessKey: '', secretKey: '', sessionToken: '', expiration: '',
  });
  const [accountId, setAccountId] = useState('');
  const [platform, setPlatform] = useState('');
  const [profileName, setProfileName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [showRole, setShowRole] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [ttl, setTtl] = useState('');
  const [localExpiration, setLocalExpiration] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [flash, setFlash] = useState('');
  const { accessKey, secretKey, sessionToken } = credentials;

  const getSuccessCallback = (data: {
    accountId: string;
    accessKey: string;
    secretKey: string;
    sessionToken: string;
    expiration: string;
    platform: string;
    profileName: string;
    roleName: string;
    showRole: boolean;
    error?: string;
  }) => {
    const firstLoad = credentials.accessKey === '';

    setAccountId(data.accountId);
    setCredentials({
      accessKey: data.accessKey,
      secretKey: data.secretKey,
      sessionToken: data.sessionToken,
      expiration: data.expiration,
    });
    setTtl(relativeDate(data.expiration));
    setLocalExpiration(new Date(data.expiration));
    setPlatform(data.platform);
    setProfileName(data.profileName);
    setRoleName(data.roleName);
    setShowRole(data.showRole);

    if (data.error) {
      setError(data.error);
      setFlash('');
    } else {
      if (!firstLoad) {
        setFlash('Updated credentials');
        setTimeout(() => setFlash(''), 3000);
      }
      setError('');
    }
  };

  useInterval(() => {
    setTtl(relativeDate(credentials.expiration));
  }, 1000);

  useEffect(() => {
    (async () => {
      const data = await window.electronAPI.refresh();
      if (data.redirect) {
        window.location.href = data.redirect;
      }
      const dm = await window.electronAPI.getDarkMode();
      setDarkMode(dm);
    })();

    window.electronAPI.darkModeUpdated((_, value) => setDarkMode(value));
    window.electronAPI.reloadUi((_, value) => getSuccessCallback(value));
  }, []);

  const handleRefreshClickEvent = async (event: MouseEvent) => {
    event.preventDefault();
    const data = await window.electronAPI.refresh();
    if (data.redirect) window.location.href = data.redirect;
    if (data.logout) setStatus(data.logout);
  };

  const handleCollapse = () => {
    setCaretDirection(caretDirection === 'right' ? 'down' : 'right');
    setIsOpen(!isOpen);
  };

  if (status === 401) return <Navigate to="/" />;

  return (
    <Container>
      <Row className="d-flex p-2">
        <RoundedWrapper>
          <Logo />
          <RoundedContent>
            <Alert color="success" fade isOpen={!!flash}>
              <FontAwesomeIcon icon={['fab', 'aws']} />
              {`   ${flash}`}
            </Alert>
            <Error error={error} />
            <div>
              <BorderlessButton onClick={handleCollapse} outline={!darkMode} color="link">
                <FontAwesomeIcon icon={['fas', caretDirection === 'right' ? 'caret-right' : 'caret-down']} />
                {'   '}&nbsp;&nbsp;&nbsp;Account
              </BorderlessButton>
              <Collapse isOpen={isOpen}>
                <DarkModeAwareCard className="card card-body bg-transparent mb-3">
                  <AccountProps>
                    {profileName !== `awsaml-${accountId}` && [
                      <AccountPropsKey key="profile-name-dt">Profile:</AccountPropsKey>,
                      <AccountPropsVal key="profile-name-dd">{profileName}</AccountPropsVal>,
                    ]}
                    <AccountPropsKey>ID:</AccountPropsKey>
                    <AccountPropsVal>{accountId}</AccountPropsVal>
                    {showRole && [
                      <AccountPropsKey key="role-name-dt">Role:</AccountPropsKey>,
                      <AccountPropsVal key="role-name-dd">{roleName}</AccountPropsVal>,
                    ]}
                  </AccountProps>
                </DarkModeAwareCard>
              </Collapse>
            </div>
            <Credentials awsAccessKey={accessKey} awsSecretKey={secretKey} awsSessionToken={sessionToken} darkMode={darkMode} />
            <EnvVar>
              <p>Run these commands from a{` ${getTerm(platform)} `}to use the AWS CLI:</p>
              <PreInputGroupWithCopyButton
                id="envvars"
                inputClassName={`bg-dark text-light ${getLang(platform)}`}
                multiLine
                name="input-envvars"
                value={getEnvVars({ platform, accountId })}
                darkMode={darkMode}
              />
            </EnvVar>
            <div><b>Expires in:</b>{` ${ttl}`}</div>
            <div className="mb-3"><b>Expires at:</b>{` ${localExpiration.toString()}`}</div>
            <span className="ml-auto">
              <Button color="secondary" onClick={handleRefreshClickEvent} outline={!darkMode}>Refresh</Button>
              <Logout darkMode={darkMode} />
            </span>
          </RoundedContent>
        </RoundedWrapper>
      </Row>
    </Container>
  );
}

export default Refresh;
